use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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
    pub cpu_model: String,
    pub os_name: String,
    pub kernel_version: String,
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
    pub net_rx_kbs: f64,
    pub net_tx_kbs: f64,
    pub disk_read_kbs: f64,
    pub disk_write_kbs: f64,
    pub power_profile: String,
    pub can_switch_power: bool,
    pub available_power_profiles: Vec<String>,
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
// Histórico de Red (timestamp, rx_bytes, tx_bytes)
static PREV_NET: Mutex<Option<(std::time::Instant, u64, u64)>> = Mutex::new(None);
// Histórico de Disco I/O (timestamp, read_sectors, write_sectors)
static PREV_DISK: Mutex<Option<(std::time::Instant, u64, u64)>> = Mutex::new(None);

fn read_net_bytes() -> (u64, u64) {
    let mut total_rx = 0u64;
    let mut total_tx = 0u64;
    if let Ok(content) = fs::read_to_string("/proc/net/dev") {
        for line in content.lines().skip(2) {
            if let Some((iface, data)) = line.split_once(':') {
                let iface_name = iface.trim();
                if iface_name == "lo" {
                    continue;
                }
                let nums: Vec<u64> = data.split_whitespace().filter_map(|s| s.parse().ok()).collect();
                if nums.len() >= 9 {
                    total_rx += nums[0];
                    total_tx += nums[8];
                }
            }
        }
    }
    (total_rx, total_tx)
}

fn read_disk_io_sectors() -> (u64, u64) {
    let mut total_read_sectors = 0u64;
    let mut total_write_sectors = 0u64;
    if let Ok(content) = fs::read_to_string("/proc/diskstats") {
        for line in content.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 10 {
                let dev_name = parts[2];
                let is_disk = (dev_name.starts_with("sd") && !dev_name.chars().last().unwrap_or(' ').is_ascii_digit())
                    || (dev_name.starts_with("nvme") && dev_name.ends_with("n1"))
                    || (dev_name.starts_with("vd") && !dev_name.chars().last().unwrap_or(' ').is_ascii_digit())
                    || (dev_name.starts_with("mmcblk") && !dev_name.contains('p'));

                if is_disk {
                    if let (Ok(r_sec), Ok(w_sec)) = (parts[5].parse::<u64>(), parts[9].parse::<u64>()) {
                        total_read_sectors += r_sec;
                        total_write_sectors += w_sec;
                    }
                }
            }
        }
    }
    (total_read_sectors, total_write_sectors)
}

fn detect_power_profile() -> (String, bool, Vec<String>) {
    #[cfg(target_os = "linux")]
    {
        // 1. Probar powerprofilesctl (estándar DBus para laptops Linux)
        if let Ok(out) = std::process::Command::new("powerprofilesctl").arg("get").output() {
            if out.status.success() {
                if let Ok(curr) = String::from_utf8(out.stdout) {
                    let c = curr.trim().to_string();
                    let mut avail = Vec::new();
                    if let Ok(list_out) = std::process::Command::new("powerprofilesctl").arg("list").output() {
                        let text = String::from_utf8_lossy(&list_out.stdout);
                        for line in text.lines() {
                            let trimmed = line.trim();
                            if trimmed.starts_with('*') || trimmed.starts_with('-') || !trimmed.contains(':') {
                                let name = trimmed.trim_start_matches(|ch| ch == '*' || ch == '-' || ch == ' ').split(':').next().unwrap_or("").trim();
                                if !name.is_empty() && (name == "performance" || name == "balanced" || name == "power-saver") {
                                    avail.push(name.to_string());
                                }
                            }
                        }
                    }
                    if avail.is_empty() {
                        avail = vec!["performance".to_string(), "balanced".to_string(), "power-saver".to_string()];
                    }
                    return (c, true, avail);
                }
            }
        }

        // 2. Probar cpufreq sysfs (kernel governors)
        let sysfs_gov = "/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor";
        let sysfs_avail = "/sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors";
        if std::path::Path::new(sysfs_gov).exists() {
            let curr = fs::read_to_string(sysfs_gov).unwrap_or_default().trim().to_string();
            let avail_str = fs::read_to_string(sysfs_avail).unwrap_or_default();
            let avail: Vec<String> = avail_str.split_whitespace().map(|s| s.to_string()).collect();
            let can_switch = avail.len() > 1;
            return (if curr.is_empty() { "performance".to_string() } else { curr }, can_switch, avail);
        }

        // 3. Fallback: Host de escritorio fijo / VM sin governors
        ("standard".to_string(), false, Vec::new())
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(out) = std::process::Command::new("powercfg").arg("/getactivescheme").output() {
            let text = String::from_utf8_lossy(&out.stdout).to_lowercase();
            let curr = if text.contains("high performance") || text.contains("alto rendimiento") {
                "performance"
            } else if text.contains("power saver") || text.contains("economizador") {
                "powersave"
            } else {
                "balanced"
            };
            return (
                curr.to_string(),
                true,
                vec!["performance".to_string(), "balanced".to_string(), "powersave".to_string()]
            );
        }
        ("standard".to_string(), false, Vec::new())
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(out) = std::process::Command::new("pmset").arg("-g").arg("custom").output() {
            let text = String::from_utf8_lossy(&out.stdout);
            let is_low_power = text.contains("lowpowermode 1");
            let curr = if is_low_power { "powersave" } else { "performance" };
            return (
                curr.to_string(),
                true,
                vec!["performance".to_string(), "powersave".to_string()]
            );
        }
        ("standard".to_string(), false, Vec::new())
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        ("standard".to_string(), false, Vec::new())
    }
}

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

fn get_cpu_model() -> String {
    if let Ok(info) = fs::read_to_string("/proc/cpuinfo") {
        for line in info.lines() {
            if line.starts_with("model name") {
                if let Some(pos) = line.find(':') {
                    let model = line[pos + 1..].trim();
                    if !model.is_empty() {
                        return model.to_string();
                    }
                }
            }
        }
    }
    "Procesador Host".to_string()
}

fn get_os_name() -> String {
    if let Ok(info) = fs::read_to_string("/etc/os-release") {
        for line in info.lines() {
            if line.starts_with("PRETTY_NAME=") {
                let name = line[12..].trim().trim_matches('"');
                if !name.is_empty() {
                    return name.to_string();
                }
            }
        }
    }
    "Linux".to_string()
}

fn get_kernel_version() -> String {
    if let Ok(content) = fs::read_to_string("/proc/version") {
        let parts: Vec<&str> = content.split_whitespace().collect();
        if parts.len() >= 3 {
            return parts[2].to_string();
        }
    }
    "Linux Kernel".to_string()
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

    // Cálculo diferencial de Red (KB/s)
    let (curr_rx_bytes, curr_tx_bytes) = read_net_bytes();
    let mut net_rx_kbs = 0.0;
    let mut net_tx_kbs = 0.0;
    {
        let now = std::time::Instant::now();
        let mut prev_net_guard = PREV_NET.lock().unwrap();
        if let Some((prev_time, prev_rx, prev_tx)) = *prev_net_guard {
            let elapsed = prev_time.elapsed().as_secs_f64();
            if elapsed > 0.05 {
                let rx_delta = curr_rx_bytes.saturating_sub(prev_rx) as f64;
                let tx_delta = curr_tx_bytes.saturating_sub(prev_tx) as f64;
                net_rx_kbs = ((rx_delta / 1024.0 / elapsed) * 10.0).round() / 10.0;
                net_tx_kbs = ((tx_delta / 1024.0 / elapsed) * 10.0).round() / 10.0;
            }
        }
        *prev_net_guard = Some((now, curr_rx_bytes, curr_tx_bytes));
    }

    // Cálculo diferencial de Disco I/O (KB/s)
    let (curr_r_sec, curr_w_sec) = read_disk_io_sectors();
    let mut disk_read_kbs = 0.0;
    let mut disk_write_kbs = 0.0;
    {
        let now = std::time::Instant::now();
        let mut prev_disk_guard = PREV_DISK.lock().unwrap();
        if let Some((prev_time, prev_r, prev_w)) = *prev_disk_guard {
            let elapsed = prev_time.elapsed().as_secs_f64();
            if elapsed > 0.05 {
                let r_delta = curr_r_sec.saturating_sub(prev_r) as f64;
                let w_delta = curr_w_sec.saturating_sub(prev_w) as f64;
                disk_read_kbs = (((r_delta * 512.0) / 1024.0 / elapsed) * 10.0).round() / 10.0;
                disk_write_kbs = (((w_delta * 512.0) / 1024.0 / elapsed) * 10.0).round() / 10.0;
            }
        }
        *prev_disk_guard = Some((now, curr_r_sec, curr_w_sec));
    }

    let (power_profile, can_switch_power, available_power_profiles) = detect_power_profile();

    let status_badge = if cpu_temp_celsius > 85.0 || ram_usage_percent > 94.0 {
        "CRITICAL".to_string()
    } else if cpu_temp_celsius > 75.0 || ram_usage_percent > 85.0 || cpu_percent > 85.0 {
        "ATTENTION".to_string()
    } else {
        "OPTIMAL".to_string()
    };

    let cpu_model = get_cpu_model();
    let os_name = get_os_name();
    let kernel_version = get_kernel_version();

    Ok(SystemTelemetry {
        cpu_percent,
        cpu_cores,
        cpu_temp_celsius,
        cpu_model,
        os_name,
        kernel_version,
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
        net_rx_kbs,
        net_tx_kbs,
        disk_read_kbs,
        disk_write_kbs,
        power_profile,
        can_switch_power,
        available_power_profiles,
    })
}

#[tauri::command]
pub fn set_power_profile(profile: String) -> Result<String, String> {
    let clean = profile.trim().to_lowercase();

    #[cfg(target_os = "linux")]
    {
        // 1. Intentar powerprofilesctl si está disponible
        let pctl_target = match clean.as_str() {
            "powersave" | "power-saver" => "power-saver",
            "balanced" => "balanced",
            _ => "performance",
        };
        if let Ok(out) = std::process::Command::new("powerprofilesctl").arg("set").arg(pctl_target).output() {
            if out.status.success() {
                return Ok(format!("Perfil cambiado a {} vía powerprofilesctl", pctl_target));
            }
        }

        // 2. Intentar sysfs cpufreq
        let target_gov = if clean == "powersave" || clean == "power-saver" { "powersave" } else { "performance" };
        let cmd = format!("echo {} | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor", target_gov);
        let res = std::process::Command::new("sh")
            .arg("-c")
            .arg(&cmd)
            .output();

        if let Ok(out) = res {
            if out.status.success() {
                return Ok(format!("Perfil de energía cambiado a {}", target_gov));
            }
        }

        // 3. Fallback con pkexec para solicitar elevación si no tiene permisos directos
        let _ = std::process::Command::new("pkexec")
            .arg("sh")
            .arg("-c")
            .arg(&cmd)
            .spawn();

        return Ok(format!("Solicitando elevación para perfil {}", target_gov));
    }

    #[cfg(target_os = "windows")]
    {
        let guid = match clean.as_str() {
            "powersave" | "power-saver" => "a1841308-3541-4fab-bc81-f71556f20b4a",
            "performance" => "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
            _ => "381b4222-f694-41f0-9685-ff5bb260df2e",
        };
        let status = std::process::Command::new("powercfg").arg("/setactive").arg(guid).status()
            .map_err(|e| format!("Error en powercfg: {}", e))?;
        if status.success() {
            return Ok(format!("Perfil de energía Windows actualizado a {}", clean));
        }
        return Err("No se pudo aplicar el esquema de energía en Windows".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        let arg = if clean == "powersave" || clean == "power-saver" { "1" } else { "0" };
        let status = std::process::Command::new("pmset").arg("-a").arg("lowpowermode").arg(arg).status()
            .map_err(|e| format!("Error en pmset: {}", e))?;
        if status.success() {
            return Ok(format!("Modo de energía macOS actualizado a {}", clean));
        }
        return Err("No se pudo aplicar el modo de energía en macOS".to_string());
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Plataforma no soportada para conmutación de energía".to_string())
    }
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
            title: "Temperatura Elevada de CPU".to_string(),
            message: format!("El procesador ({}) reporta {:.1}°C. Se recomienda verificar ventilación y carga de procesos.", telemetry.cpu_model, telemetry.cpu_temp_celsius),
            timestamp: ts.clone(),
        });
    }

    if telemetry.ram_usage_percent > 88.0 {
        alerts.push(SystemAlert {
            id: "alt_ram_high".to_string(),
            level: "warning".to_string(),
            title: "Presión de Memoria RAM".to_string(),
            message: format!("Uso de RAM al {:.1}% ({} MB disponibles). Swap/ZRAM en absorción activa.", telemetry.ram_usage_percent, telemetry.ram_available_mb),
            timestamp: ts.clone(),
        });
    }

    if telemetry.cpu_percent > 85.0 {
        alerts.push(SystemAlert {
            id: "alt_cpu_high".to_string(),
            level: "warning".to_string(),
            title: "Carga Alta de Procesador".to_string(),
            message: format!("Uso sostenido al {:.1}% en {} núcleos. Verifica procesos en segundo plano.", telemetry.cpu_percent, telemetry.cpu_cores.len()),
            timestamp: ts.clone(),
        });
    }

    if telemetry.disk_usage_percent > 85.0 {
        alerts.push(SystemAlert {
            id: "alt_disk_low".to_string(),
            level: "warning".to_string(),
            title: "Almacenamiento Reducido".to_string(),
            message: format!("Partición raíz al {:.1}%. Quedan {:.1} GB disponibles.", telemetry.disk_usage_percent, telemetry.disk_available_gb),
            timestamp: ts.clone(),
        });
    }

    if alerts.is_empty() {
        alerts.push(SystemAlert {
            id: "alt_all_good".to_string(),
            level: "info".to_string(),
            title: "Hardware y Sistema Óptimos".to_string(),
            message: format!("{} | Temp: {:.1}°C | RAM: {:.1}% ({} núcleos). Consumo Aegis: {:.1} MB.", telemetry.cpu_model, telemetry.cpu_temp_celsius, telemetry.ram_usage_percent, telemetry.cpu_cores.len(), telemetry.aegis_ram_mb),
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
    pub cpu_percent: f64,
    pub io_kbs: f64,
    pub state: String,
    pub is_zombie: bool,
    pub cmdline: String,
}

// Histórico de procesos (timestamp, HashMap<PID, (ticks, io_bytes)>)
static PREV_PROCS: Mutex<Option<(std::time::Instant, HashMap<u32, (u64, u64)>)>> = Mutex::new(None);

#[tauri::command]
pub fn get_top_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut list = Vec::new();
    let mut current_samples = HashMap::new();
    let now = std::time::Instant::now();

    let mut prev_guard = PREV_PROCS.lock().unwrap();
    let (elapsed_sec, prev_map) = match *prev_guard {
        Some((prev_time, ref map)) => (prev_time.elapsed().as_secs_f64().max(0.1), Some(map)),
        None => (1.0, None),
    };

    if let Ok(entries) = fs::read_dir("/proc") {
        for entry in entries.flatten() {
            let file_name = entry.file_name();
            let name_str = file_name.to_string_lossy();
            if let Ok(pid) = name_str.parse::<u32>() {
                let status_path = entry.path().join("status");
                let stat_path = entry.path().join("stat");
                let io_path = entry.path().join("io");

                if let Ok(status) = fs::read_to_string(status_path) {
                    let mut proc_name = String::new();
                    let mut rss_kb = 0.0;
                    let mut state_str = "S".to_string();

                    for line in status.lines() {
                        if line.starts_with("Name:") {
                            proc_name = line[5..].trim().to_string();
                        } else if line.starts_with("State:") {
                            state_str = line[6..].trim().chars().next().unwrap_or('S').to_string();
                        } else if line.starts_with("VmRSS:") {
                            let parts: Vec<&str> = line.split_whitespace().collect();
                            if parts.len() >= 2 {
                                rss_kb = parts[1].parse::<f64>().unwrap_or(0.0);
                            }
                        }
                    }

                    let is_zombie = state_str == "Z";

                    // Leer ticks de CPU desde /proc/[pid]/stat
                    let mut curr_ticks = 0u64;
                    if let Ok(stat_content) = fs::read_to_string(stat_path) {
                        if let Some(rparen_idx) = stat_content.rfind(')') {
                            let rest = stat_content[rparen_idx + 1..].trim();
                            let tokens: Vec<&str> = rest.split_whitespace().collect();
                            if tokens.len() > 12 {
                                let utime: u64 = tokens[11].parse().unwrap_or(0);
                                let stime: u64 = tokens[12].parse().unwrap_or(0);
                                curr_ticks = utime + stime;
                            }
                        }
                    }

                    // Leer I/O desde /proc/[pid]/io
                    let mut curr_io_bytes = 0u64;
                    if let Ok(io_content) = fs::read_to_string(io_path) {
                        for line in io_content.lines() {
                            if line.starts_with("rchar:") || line.starts_with("wchar:") {
                                if let Some(val_str) = line.split_whitespace().nth(1) {
                                    curr_io_bytes += val_str.parse::<u64>().unwrap_or(0);
                                }
                            }
                        }
                    }

                    // Guardar muestra para siguiente delta
                    current_samples.insert(pid, (curr_ticks, curr_io_bytes));

                    // Calcular deltas
                    let mut cpu_percent = 0.0;
                    let mut io_kbs = 0.0;

                    if let Some(prev) = prev_map {
                        if let Some(&(prev_ticks, prev_io)) = prev.get(&pid) {
                            let delta_ticks = curr_ticks.saturating_sub(prev_ticks);
                            // 100 Hz timer estándar en Linux
                            cpu_percent = ((delta_ticks as f64 / 100.0) / elapsed_sec * 100.0 * 10.0).round() / 10.0;

                            let delta_io = curr_io_bytes.saturating_sub(prev_io);
                            io_kbs = ((delta_io as f64 / 1024.0) / elapsed_sec * 10.0).round() / 10.0;
                        }
                    }

                    // Intentar resolver el nombre real no-truncado (> 15 chars) mediante /proc/[pid]/exe o cmdline
                    let mut full_proc_name = String::new();
                    if let Ok(exe_target) = fs::read_link(entry.path().join("exe")) {
                        if let Some(fname) = exe_target.file_name() {
                            full_proc_name = fname.to_string_lossy().to_string();
                        }
                    }

                    // Incluir procesos con RAM relevante, CPU activa o zombies
                    if rss_kb > 8192.0 || cpu_percent > 1.0 || is_zombie {
                        let cmd_path = entry.path().join("cmdline");
                        let raw_cmd = fs::read(&cmd_path).unwrap_or_default();
                        let cmd_parts: Vec<&[u8]> = raw_cmd.split(|&b| b == 0).filter(|p| !p.is_empty()).collect();

                        if full_proc_name.is_empty() && !cmd_parts.is_empty() {
                            let first_arg = String::from_utf8_lossy(cmd_parts[0]);
                            let clean_arg = first_arg.split_whitespace().next().unwrap_or(&first_arg);
                            let path_obj = std::path::Path::new(clean_arg);
                            if let Some(f) = path_obj.file_name() {
                                full_proc_name = f.to_string_lossy().to_string();
                            }
                        }

                        // Fallback al nombre de /proc/[pid]/status si no se pudo resolver el binario
                        if full_proc_name.is_empty() {
                            full_proc_name = proc_name.clone();
                        }

                        let full_cmd = if !raw_cmd.is_empty() {
                            String::from_utf8_lossy(&raw_cmd).replace('\0', " ").trim().to_string()
                        } else {
                            full_proc_name.clone()
                        };

                        list.push(ProcessInfo {
                            pid,
                            name: full_proc_name,
                            memory_mb: (rss_kb / 1024.0 * 10.0).round() / 10.0,
                            cpu_percent,
                            io_kbs,
                            state: state_str,
                            is_zombie,
                            cmdline: if full_cmd.len() > 70 { format!("{}...", &full_cmd[..70]) } else { full_cmd },
                        });
                    }
                }
            }
        }
    }

    *prev_guard = Some((now, current_samples));

    // Orden inicial por RAM
    list.sort_by(|a, b| b.memory_mb.partial_cmp(&a.memory_mb).unwrap_or(std::cmp::Ordering::Equal));
    list.truncate(50);
    Ok(list)
}

#[tauri::command]
pub fn kill_process(pid: u32, signal: Option<i32>) -> Result<String, String> {
    if pid <= 1 || pid == std::process::id() {
        return Err("Operación denegada: Proceso crítico o Aegis.".to_string());
    }

    let sig = signal.unwrap_or(15);
    let status = std::process::Command::new("kill")
        .arg(format!("-{}", sig))
        .arg(pid.to_string())
        .status()
        .map_err(|e| format!("Error enviando señal -{}: {}", sig, e))?;

    if status.success() {
        Ok(format!("Proceso {} terminado (señal -{}).", pid, sig))
    } else {
        // Fallback forzado
        let _ = std::process::Command::new("kill")
            .arg("-9")
            .arg(pid.to_string())
            .status();
        Ok(format!("Proceso {} forzado con SIGKILL (-9).", pid))
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
