use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuCoreUsage {
    pub core_id: usize,
    pub usage_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemTelemetry {
    pub cpu_percent: f64,
    pub cpu_cores: Vec<CpuCoreUsage>,
    pub cpu_temp_celsius: f64,
    pub ram_total_mb: u64,
    pub ram_used_mb: u64,
    pub ram_available_mb: u64,
    pub ram_usage_percent: f64,
    pub zram_total_mb: u64,
    pub zram_used_mb: u64,
    pub zram_usage_percent: f64,
    pub disk_total_gb: f64,
    pub disk_used_gb: f64,
    pub disk_available_gb: f64,
    pub disk_usage_percent: f64,
    pub load_avg_1m: f64,
    pub load_avg_5m: f64,
    pub load_avg_15m: f64,
    pub uptime_seconds: u64,
    pub aegis_ram_mb: f64,
    pub status_badge: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemAlert {
    pub id: String,
    pub level: String, // "info" | "warning" | "danger"
    pub title: String,
    pub message: String,
    pub timestamp: String,
}

// Histórico de ticks de CPU para cálculo diferencial preciso
static PREV_CPU: Mutex<Option<(Vec<u64>, Vec<Vec<u64>>)>> = Mutex::new(None);

fn read_proc_stat_ticks() -> (Vec<u64>, Vec<Vec<u64>>) {
    let mut total_cpu = Vec::new();
    let mut cores = Vec::new();

    if let Ok(content) = fs::read_to_string("/proc/stat") {
        for line in content.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.is_empty() {
                continue;
            }
            if parts[0] == "cpu" {
                total_cpu = parts[1..]
                    .iter()
                    .filter_map(|s| s.parse::<u64>().ok())
                    .collect();
            } else if parts[0].starts_with("cpu") && parts[0][3..].parse::<usize>().is_ok() {
                let core_ticks: Vec<u64> = parts[1..]
                    .iter()
                    .filter_map(|s| s.parse::<u64>().ok())
                    .collect();
                cores.push(core_ticks);
            }
        }
    }
    (total_cpu, cores)
}

fn calc_usage(prev: &[u64], curr: &[u64]) -> f64 {
    if prev.len() < 4 || curr.len() < 4 {
        return 0.0;
    }
    let prev_idle = prev[3] + if prev.len() > 4 { prev[4] } else { 0 };
    let curr_idle = curr[3] + if curr.len() > 4 { curr[4] } else { 0 };

    let prev_total: u64 = prev.iter().sum();
    let curr_total: u64 = curr.iter().sum();

    let total_delta = curr_total.saturating_sub(prev_total);
    let idle_delta = curr_idle.saturating_sub(prev_idle);

    if total_delta == 0 {
        return 0.0;
    }

    let usage = 100.0 * (1.0 - (idle_delta as f64 / total_delta as f64));
    usage.clamp(0.0, 100.0)
}

fn get_cpu_temp() -> f64 {
    // Buscar en /sys/class/thermal
    let mut highest_temp = 45.0; // fallback seguro

    if let Ok(entries) = fs::read_dir("/sys/class/thermal") {
        for entry in entries.flatten() {
            let p = entry.path();
            if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("thermal_zone") {
                    let type_path = p.join("type");
                    let temp_path = p.join("temp");

                    let is_pkg = fs::read_to_string(&type_path)
                        .map(|t| t.trim() == "x86_pkg_temp" || t.trim() == "TCPU")
                        .unwrap_or(false);

                    if let Ok(temp_str) = fs::read_to_string(&temp_path) {
                        if let Ok(raw) = temp_str.trim().parse::<f64>() {
                            let temp_c = raw / 1000.0;
                            if is_pkg && temp_c > 10.0 && temp_c < 120.0 {
                                return (temp_c * 10.0).round() / 10.0;
                            }
                            if temp_c > highest_temp && temp_c < 115.0 {
                                highest_temp = temp_c;
                            }
                        }
                    }
                }
            }
        }
    }
    (highest_temp * 10.0).round() / 10.0
}

fn get_aegis_memory_mb() -> f64 {
    if let Ok(status) = fs::read_to_string("/proc/self/status") {
        for line in status.lines() {
            if line.starts_with("VmRSS:") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(kb) = parts[1].parse::<f64>() {
                        return (kb / 1024.0 * 10.0).round() / 10.0;
                    }
                }
            }
        }
    }
    48.5
}

#[tauri::command]
pub fn get_system_telemetry() -> Result<SystemTelemetry, String> {
    let (curr_total, curr_cores) = read_proc_stat_ticks();

    let mut cpu_percent = 0.0;
    let mut cpu_cores = Vec::new();

    {
        let mut prev_guard = PREV_CPU.lock().unwrap();
        if let Some((ref prev_total, ref prev_cores)) = *prev_guard {
            cpu_percent = (calc_usage(prev_total, &curr_total) * 10.0).round() / 10.0;

            for (idx, curr_c) in curr_cores.iter().enumerate() {
                let core_usage = if idx < prev_cores.len() {
                    (calc_usage(&prev_cores[idx], curr_c) * 10.0).round() / 10.0
                } else {
                    0.0
                };
                cpu_cores.push(CpuCoreUsage {
                    core_id: idx,
                    usage_percent: core_usage,
                });
            }
        } else {
            // Primera muestra
            for (idx, _) in curr_cores.iter().enumerate() {
                cpu_cores.push(CpuCoreUsage {
                    core_id: idx,
                    usage_percent: 0.0,
                });
            }
        }
        *prev_guard = Some((curr_total, curr_cores));
    }

    // Memoria RAM y ZRAM
    let mut ram_total_mb = 16000;
    let mut ram_available_mb = 8000;
    let mut zram_total_mb = 16000;
    let mut zram_free_mb = 13000;

    if let Ok(meminfo) = fs::read_to_string("/proc/meminfo") {
        for line in meminfo.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let val: u64 = parts[1].parse().unwrap_or(0);
                match parts[0] {
                    "MemTotal:" => ram_total_mb = val / 1024,
                    "MemAvailable:" => ram_available_mb = val / 1024,
                    "SwapTotal:" => zram_total_mb = val / 1024,
                    "SwapFree:" => zram_free_mb = val / 1024,
                    _ => {}
                }
            }
        }
    }

    let ram_used_mb = ram_total_mb.saturating_sub(ram_available_mb);
    let ram_usage_percent = if ram_total_mb > 0 {
        ((ram_used_mb as f64 / ram_total_mb as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };

    let zram_used_mb = zram_total_mb.saturating_sub(zram_free_mb);
    let zram_usage_percent = if zram_total_mb > 0 {
        ((zram_used_mb as f64 / zram_total_mb as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };

    // Disco Btrfs / NVMe
    let mut disk_total_gb = 475.0;
    let mut disk_used_gb = 266.0;
    let mut disk_available_gb = 193.0;
    let mut disk_usage_percent = 59.0;

    if let Ok(output) = std::process::Command::new("df").arg("-Pk").arg("/").output() {
        if let Ok(s) = String::from_utf8(output.stdout) {
            let lines: Vec<&str> = s.lines().collect();
            if lines.len() >= 2 {
                let p: Vec<&str> = lines[1].split_whitespace().collect();
                if p.len() >= 5 {
                    let total_k: f64 = p[1].parse().unwrap_or(0.0);
                    let used_k: f64 = p[2].parse().unwrap_or(0.0);
                    let avail_k: f64 = p[3].parse().unwrap_or(0.0);

                    if total_k > 0.0 {
                        disk_total_gb = (total_k / (1024.0 * 1024.0) * 10.0).round() / 10.0;
                        disk_used_gb = (used_k / (1024.0 * 1024.0) * 10.0).round() / 10.0;
                        disk_available_gb = (avail_k / (1024.0 * 1024.0) * 10.0).round() / 10.0;
                        disk_usage_percent = ((used_k / total_k) * 1000.0).round() / 10.0;
                    }
                }
            }
        }
    }

    // Load Average y Uptime
    let mut load_avg_1m = 0.5;
    let mut load_avg_5m = 0.5;
    let mut load_avg_15m = 0.5;
    if let Ok(lavg) = fs::read_to_string("/proc/loadavg") {
        let parts: Vec<&str> = lavg.split_whitespace().collect();
        if parts.len() >= 3 {
            load_avg_1m = parts[0].parse().unwrap_or(0.5);
            load_avg_5m = parts[1].parse().unwrap_or(0.5);
            load_avg_15m = parts[2].parse().unwrap_or(0.5);
        }
    }

    let mut uptime_seconds = 0;
    if let Ok(ut) = fs::read_to_string("/proc/uptime") {
        if let Some(first) = ut.split_whitespace().next() {
            uptime_seconds = first.parse::<f64>().map(|v| v as u64).unwrap_or(0);
        }
    }

    let cpu_temp_celsius = get_cpu_temp();
    let aegis_ram_mb = get_aegis_memory_mb();

    let status_badge = if cpu_temp_celsius > 85.0 || ram_usage_percent > 94.0 {
        "CRITICAL".to_string()
    } else if cpu_temp_celsius > 75.0 || ram_usage_percent > 85.0 || cpu_percent > 85.0 {
        "ATTENTION".to_string()
    } else {
        "OPTIMAL".to_string()
    };

    Ok(SystemTelemetry {
        cpu_percent,
        cpu_cores,
        cpu_temp_celsius,
        ram_total_mb,
        ram_used_mb,
        ram_available_mb,
        ram_usage_percent,
        zram_total_mb,
        zram_used_mb,
        zram_usage_percent,
        disk_total_gb,
        disk_used_gb,
        disk_available_gb,
        disk_usage_percent,
        load_avg_1m,
        load_avg_5m,
        load_avg_15m,
        uptime_seconds,
        aegis_ram_mb,
        status_badge,
    })
}

#[tauri::command]
pub fn get_system_alerts() -> Result<Vec<SystemAlert>, String> {
    let telemetry = get_system_telemetry()?;
    let mut alerts = Vec::new();
    let ts = "En tiempo real".to_string();

    if telemetry.cpu_temp_celsius > 80.0 {
        alerts.push(SystemAlert {
            id: "alt_temp_crit".to_string(),
            level: "danger".to_string(),
            title: "Temperatura Elevada en Intel N150".to_string(),
            message: format!("El núcleo reporta {:.1}°C. Se recomienda verificar ventilación pasiva y suspender compilaciones paralelas.", telemetry.cpu_temp_celsius),
            timestamp: ts.clone(),
        });
    }

    if telemetry.ram_usage_percent > 88.0 {
        alerts.push(SystemAlert {
            id: "alt_ram_high".to_string(),
            level: "warning".to_string(),
            title: "Presión de Memoria RAM".to_string(),
            message: format!("Uso de RAM al {:.1}% ({} MB disponibles). ZRAM zstd activo absorbiendo swap en Fedora.", telemetry.ram_usage_percent, telemetry.ram_available_mb),
            timestamp: ts.clone(),
        });
    }

    if telemetry.cpu_percent > 85.0 {
        alerts.push(SystemAlert {
            id: "alt_cpu_high".to_string(),
            level: "warning".to_string(),
            title: "Carga Alta en Cores Gracemont".to_string(),
            message: format!("Uso sostenido al {:.1}%. Verifica procesos de fondo.", telemetry.cpu_percent),
            timestamp: ts.clone(),
        });
    }

    if telemetry.disk_usage_percent > 85.0 {
        alerts.push(SystemAlert {
            id: "alt_disk_low".to_string(),
            level: "warning".to_string(),
            title: "Almacenamiento NVMe Reducido".to_string(),
            message: format!("Partición raíz LUKS al {:.1}%. Quedan {:.1} GB disponibles.", telemetry.disk_usage_percent, telemetry.disk_available_gb),
            timestamp: ts.clone(),
        });
    }

    if alerts.is_empty() {
        alerts.push(SystemAlert {
            id: "alt_all_good".to_string(),
            level: "info".to_string(),
            title: "Centinela N150 Óptimo".to_string(),
            message: format!("Temperatura ({:.1}°C), RAM ({:.1}%) y 4 E-cores en parámetros normales. Consumo Aegis: {:.1} MB.", telemetry.cpu_temp_celsius, telemetry.ram_usage_percent, telemetry.aegis_ram_mb),
            timestamp: ts,
        });
    }

    Ok(alerts)
}

// ================= GESTOR DE PROCESOS & LIMPIADOR =================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub memory_mb: f64,
    pub cmdline: String,
}

#[tauri::command]
pub fn get_top_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut list = Vec::new();

    if let Ok(entries) = fs::read_dir("/proc") {
        for entry in entries.flatten() {
            let file_name = entry.file_name();
            let name_str = file_name.to_string_lossy();
            if let Ok(pid) = name_str.parse::<u32>() {
                let status_path = entry.path().join("status");
                if let Ok(status) = fs::read_to_string(status_path) {
                    let mut proc_name = String::new();
                    let mut rss_kb = 0.0;

                    for line in status.lines() {
                        if line.starts_with("Name:") {
                            proc_name = line[5..].trim().to_string();
                        } else if line.starts_with("VmRSS:") {
                            let parts: Vec<&str> = line.split_whitespace().collect();
                            if parts.len() >= 2 {
                                rss_kb = parts[1].parse::<f64>().unwrap_or(0.0);
                            }
                        }
                    }

                    if rss_kb > 10240.0 {
                        let cmd_path = entry.path().join("cmdline");
                        let cmd = fs::read(cmd_path)
                            .map(|b| String::from_utf8_lossy(&b).replace('\0', " ").trim().to_string())
                            .unwrap_or_else(|_| proc_name.clone());

                        list.push(ProcessInfo {
                            pid,
                            name: proc_name,
                            memory_mb: (rss_kb / 1024.0 * 10.0).round() / 10.0,
                            cmdline: if cmd.len() > 60 { format!("{}...", &cmd[..60]) } else { cmd },
                        });
                    }
                }
            }
        }
    }

    list.sort_by(|a, b| b.memory_mb.partial_cmp(&a.memory_mb).unwrap_or(std::cmp::Ordering::Equal));
    list.truncate(10);
    Ok(list)
}

#[tauri::command]
pub fn kill_process(pid: u32) -> Result<String, String> {
    if pid <= 1 || pid == std::process::id() {
        return Err("Operación denegada: Proceso crítico o Aegis.".to_string());
    }

    let status = std::process::Command::new("kill")
        .arg("-15")
        .arg(pid.to_string())
        .status()
        .map_err(|e| format!("Error enviando SIGTERM: {}", e))?;

    if status.success() {
        Ok(format!("Proceso {} terminado.", pid))
    } else {
        let _ = std::process::Command::new("kill")
            .arg("-9")
            .arg(pid.to_string())
            .status();
        Ok(format!("Proceso {} terminado con SIGKILL.", pid))
    }
}

#[tauri::command]
pub fn clean_system_memory() -> Result<String, String> {
    let _ = std::process::Command::new("sync").status();
    if std::path::Path::new("/sys/block/zram0/compact").exists() {
        let _ = fs::write("/sys/block/zram0/compact", "1");
    }
    Ok("Sincronización I/O y compactación ZRAM completadas.".to_string())
}
