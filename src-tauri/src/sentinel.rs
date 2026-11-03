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

// ==========================================
// FASE 6.3: MANTENIMIENTO DEL SISTEMA & LIMPIADOR DE DISCO
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanableTarget {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: String,
    pub size_bytes: u64,
    pub size_formatted: String,
    pub file_count: usize,
    pub safe_to_delete: bool,
    pub exists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskCleanReport {
    pub targets: Vec<CleanableTarget>,
    pub total_size_bytes: u64,
    pub total_size_formatted: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurgeResult {
    pub target_id: String,
    pub freed_bytes: u64,
    pub freed_formatted: String,
    pub message: String,
    pub success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemUpdatesReport {
    pub manager: String,
    pub updates_available: usize,
    pub packages: Vec<String>,
    pub status_message: String,
    pub update_command: String,
}

fn get_user_home() -> Option<std::path::PathBuf> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .ok()
        .map(std::path::PathBuf::from)
}

fn dir_size_and_count(path: &std::path::Path) -> (u64, usize) {
    let mut total_size = 0;
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    total_size += meta.len();
                    count += 1;
                } else if meta.is_dir() {
                    let (sub_sz, sub_cnt) = dir_size_and_count(&entry.path());
                    total_size += sub_sz;
                    count += sub_cnt;
                }
            }
        }
    }
    (total_size, count)
}

fn clean_dir_contents(path: &std::path::Path) -> (u64, usize) {
    let mut freed_bytes = 0;
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if let Ok(meta) = entry.metadata() {
                let sz = if meta.is_file() {
                    meta.len()
                } else {
                    let (sub_sz, _) = dir_size_and_count(&p);
                    sub_sz
                };
                let removed = if meta.is_dir() {
                    fs::remove_dir_all(&p).is_ok()
                } else {
                    fs::remove_file(&p).is_ok()
                };
                if removed {
                    freed_bytes += sz;
                    count += 1;
                }
            }
        }
    }
    (freed_bytes, count)
}

fn format_bytes(bytes: u64) -> String {
    if bytes >= 1024 * 1024 * 1024 {
        format!("{:.2} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    } else if bytes >= 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    } else if bytes >= 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

static CLEAN_CACHE: Mutex<Option<(std::time::Instant, DiskCleanReport)>> = Mutex::new(None);
static UPDATES_CACHE: Mutex<Option<(std::time::Instant, SystemUpdatesReport)>> = Mutex::new(None);
static AUTOSTART_CACHE: Mutex<Option<(std::time::Instant, Vec<AutostartItem>)>> = Mutex::new(None);

#[tauri::command]
pub fn scan_cleanable_targets(force: Option<bool>) -> Result<DiskCleanReport, String> {
    if force != Some(true) {
        if let Ok(guard) = CLEAN_CACHE.lock() {
            if let Some((instant, ref report)) = *guard {
                if instant.elapsed().as_secs() < 120 {
                    return Ok(report.clone());
                }
            }
        }
    }

    let home = get_user_home().ok_or_else(|| "No se pudo determinar el directorio de usuario".to_string())?;
    let mut targets = Vec::new();
    let mut total_bytes = 0u64;

    let target_defs = vec![
        (
            "thumbnails",
            "Miniaturas del Sistema",
            "Vistas previas cacheadas de imágenes, videos y documentos.",
            home.join(".cache/thumbnails"),
            true
        ),
        (
            "npm_cache",
            "Caché de Paquetes NPM",
            "Archivos temporales e instaladores cacheados por Node.js y npm.",
            home.join(".npm/_cacache"),
            true
        ),
        (
            "cargo_cache",
            "Caché de Crates Rust/Cargo",
            "Archivos .crate comprimidos y registry cache de dependencias Cargo.",
            home.join(".cargo/registry/cache"),
            true
        ),
        (
            "pip_cache",
            "Caché de Paquetes Python (PIP)",
            "Paquetes wheel y tarballs descargados en instalaciones de Python.",
            home.join(".cache/pip"),
            true
        ),
        (
            "dnf_cache",
            "Caché DNF / libdnf5 (Usuario)",
            "Metadatos de repositorios y caches de paquetes a nivel de usuario.",
            home.join(".cache/libdnf5"),
            true
        ),
        (
            "system_tmp",
            "Archivos Temporales (/tmp)",
            "Archivos temporales del sistema creados por sesiones y apps de usuario.",
            std::path::PathBuf::from("/tmp"),
            false
        ),
    ];

    for (id, name, desc, path, safe) in target_defs {
        if path.exists() {
            let (size, count) = if id == "system_tmp" {
                let mut sz = 0;
                let mut cnt = 0;
                if let Ok(entries) = fs::read_dir(&path) {
                    for entry in entries.flatten().take(120) {
                        if let Ok(meta) = entry.metadata() {
                            if meta.is_file() {
                                sz += meta.len();
                                cnt += 1;
                            }
                        }
                    }
                }
                (sz, cnt)
            } else {
                dir_size_and_count(&path)
            };

            total_bytes += size;
            targets.push(CleanableTarget {
                id: id.to_string(),
                name: name.to_string(),
                description: desc.to_string(),
                path: path.to_string_lossy().to_string(),
                size_bytes: size,
                size_formatted: format_bytes(size),
                file_count: count,
                safe_to_delete: safe,
                exists: true,
            });
        }
    }

    if std::process::Command::new("which").arg("flatpak").output().map(|o| o.status.success()).unwrap_or(false) {
        targets.push(CleanableTarget {
            id: "flatpak_unused".to_string(),
            name: "Runtimes Huérfanos Flatpak".to_string(),
            description: "Runtimes y extensiones de Flatpak no vinculados a apps activas.".to_string(),
            path: "flatpak runtimes".to_string(),
            size_bytes: 0,
            size_formatted: "Auto-purga".to_string(),
            file_count: 0,
            safe_to_delete: true,
            exists: true,
        });
    }

    let report = DiskCleanReport {
        total_size_bytes: total_bytes,
        total_size_formatted: format_bytes(total_bytes),
        targets,
    };

    if let Ok(mut guard) = CLEAN_CACHE.lock() {
        *guard = Some((std::time::Instant::now(), report.clone()));
    }

    Ok(report)
}

#[tauri::command]
pub fn purge_cleanable_target(target_id: String) -> Result<PurgeResult, String> {
    let home = get_user_home().ok_or_else(|| "No se pudo determinar el directorio de usuario".to_string())?;

    match target_id.as_str() {
        "thumbnails" => {
            let p = home.join(".cache/thumbnails");
            let (freed, count) = clean_dir_contents(&p);
            Ok(PurgeResult {
                target_id,
                freed_bytes: freed,
                freed_formatted: format_bytes(freed),
                message: format!("Eliminados {} archivos de miniaturas ({} liberados).", count, format_bytes(freed)),
                success: true,
            })
        }
        "npm_cache" => {
            let p = home.join(".npm/_cacache");
            let (freed, count) = clean_dir_contents(&p);
            let _ = std::process::Command::new("npm").args(["cache", "clean", "--force"]).status();
            Ok(PurgeResult {
                target_id,
                freed_bytes: freed,
                freed_formatted: format_bytes(freed),
                message: format!("Caché de NPM purgada: {} archivos ({} liberados).", count, format_bytes(freed)),
                success: true,
            })
        }
        "cargo_cache" => {
            let p = home.join(".cargo/registry/cache");
            let (freed, count) = clean_dir_contents(&p);
            Ok(PurgeResult {
                target_id,
                freed_bytes: freed,
                freed_formatted: format_bytes(freed),
                message: format!("Caché de Cargo purgada: {} crates ({} liberados).", count, format_bytes(freed)),
                success: true,
            })
        }
        "pip_cache" => {
            let p = home.join(".cache/pip");
            let (freed, count) = clean_dir_contents(&p);
            Ok(PurgeResult {
                target_id,
                freed_bytes: freed,
                freed_formatted: format_bytes(freed),
                message: format!("Caché de PIP purgada: {} paquetes ({} liberados).", count, format_bytes(freed)),
                success: true,
            })
        }
        "dnf_cache" => {
            let p1 = home.join(".cache/libdnf5");
            let p2 = home.join(".cache/dnf");
            let (f1, c1) = clean_dir_contents(&p1);
            let (f2, c2) = clean_dir_contents(&p2);
            let total_f = f1 + f2;
            let total_c = c1 + c2;
            Ok(PurgeResult {
                target_id,
                freed_bytes: total_f,
                freed_formatted: format_bytes(total_f),
                message: format!("Caché DNF de usuario purgada: {} archivos ({} liberados).", total_c, format_bytes(total_f)),
                success: true,
            })
        }
        "flatpak_unused" => {
            let output = std::process::Command::new("flatpak")
                .args(["uninstall", "--unused", "--noninteractive", "-y"])
                .output();
            match output {
                Ok(out) if out.status.success() => {
                    let msg = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    let summary = if msg.is_empty() || msg.contains("Nada") {
                        "No había runtimes huérfanos de Flatpak pendientes de desinstalación.".to_string()
                    } else {
                        "Runtimes huérfanos de Flatpak desinstalados correctamente.".to_string()
                    };
                    Ok(PurgeResult {
                        target_id,
                        freed_bytes: 0,
                        freed_formatted: "OK".to_string(),
                        message: summary,
                        success: true,
                    })
                }
                Ok(out) => {
                    let err = String::from_utf8_lossy(&out.stderr);
                    Ok(PurgeResult {
                        target_id,
                        freed_bytes: 0,
                        freed_formatted: "0 B".to_string(),
                        message: format!("Flatpak: {}", err.trim()),
                        success: false,
                    })
                }
                Err(e) => Err(format!("Error ejecutando flatpak: {}", e)),
            }
        }
        _ => Err(format!("Target de limpieza no reconocido o restringido: {}", target_id)),
    }
}

#[tauri::command]
pub fn purge_all_cleanable_targets() -> Result<Vec<PurgeResult>, String> {
    let report = scan_cleanable_targets(Some(true))?;
    let mut results = Vec::new();
    for target in report.targets {
        if target.safe_to_delete && (target.size_bytes > 0 || target.id == "flatpak_unused") {
            if let Ok(res) = purge_cleanable_target(target.id) {
                results.push(res);
            }
        }
    }
    if let Ok(mut guard) = CLEAN_CACHE.lock() {
        *guard = None;
    }
    Ok(results)
}

#[tauri::command]
pub fn check_system_updates(force: Option<bool>) -> Result<SystemUpdatesReport, String> {
    if force != Some(true) {
        if let Ok(guard) = UPDATES_CACHE.lock() {
            if let Some((instant, ref report)) = *guard {
                if instant.elapsed().as_secs() < 300 {
                    return Ok(report.clone());
                }
            }
        }
    }
    let report = if let Ok(output) = std::process::Command::new("dnf").args(["check-update", "-C", "-q"]).output() {
        let code = output.status.code().unwrap_or(0);
        if code == 100 {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut pkgs = Vec::new();
            for line in stdout.lines() {
                let trimmed = line.trim();
                if !trimmed.is_empty() && !trimmed.starts_with("Last metadata") && !trimmed.starts_with("Última") {
                    if let Some(pkg_name) = trimmed.split_whitespace().next() {
                        pkgs.push(pkg_name.to_string());
                    }
                }
            }
            let count = pkgs.len();
            SystemUpdatesReport {
                manager: "DNF (Fedora / RHEL)".to_string(),
                updates_available: count,
                packages: pkgs,
                status_message: format!("{} actualizaciones listas para instalar.", count),
                update_command: "sudo dnf upgrade -y".to_string(),
            }
        } else if code == 0 {
            SystemUpdatesReport {
                manager: "DNF (Fedora / RHEL)".to_string(),
                updates_available: 0,
                packages: Vec::new(),
                status_message: "Sistema completamente al día (sin parches pendientes).".to_string(),
                update_command: "sudo dnf upgrade -y".to_string(),
            }
        } else {
            SystemUpdatesReport {
                manager: "DNF (Fedora / RHEL)".to_string(),
                updates_available: 0,
                packages: Vec::new(),
                status_message: "Sistema al día.".to_string(),
                update_command: "sudo dnf upgrade -y".to_string(),
            }
        }
    } else if let Ok(output) = std::process::Command::new("apt-get").args(["-s", "-q", "upgrade"]).output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut pkgs = Vec::new();
            for line in stdout.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("Inst ") {
                    if let Some(pkg) = trimmed.split_whitespace().nth(1) {
                        pkgs.push(pkg.to_string());
                    }
                }
            }
            let count = pkgs.len();
            SystemUpdatesReport {
                manager: "APT (Debian / Ubuntu)".to_string(),
                updates_available: count,
                packages: pkgs,
                status_message: if count == 0 { "Sistema al día.".to_string() } else { format!("{} paquetes actualizables.", count) },
                update_command: "sudo apt update && sudo apt upgrade -y".to_string(),
            }
        } else {
            SystemUpdatesReport {
                manager: "Genérico".to_string(),
                updates_available: 0,
                packages: Vec::new(),
                status_message: "Sin gestor detectado.".to_string(),
                update_command: "echo 'No package manager detected'".to_string(),
            }
        }
    } else {
        SystemUpdatesReport {
            manager: "Genérico".to_string(),
            updates_available: 0,
            packages: Vec::new(),
            status_message: "Sin gestor de paquetes soportado detectado.".to_string(),
            update_command: "echo 'No package manager detected'".to_string(),
        }
    };

    if let Ok(mut guard) = UPDATES_CACHE.lock() {
        *guard = Some((std::time::Instant::now(), report.clone()));
    }

    Ok(report)
}

#[tauri::command]
pub fn launch_system_update() -> Result<String, String> {
    let report = check_system_updates(Some(false))?;
    let cmd_str = report.update_command;
    let full_script = format!("{}; echo ''; echo 'Proceso completado. Presiona Enter para cerrar esta ventana...'; read", cmd_str);

    #[cfg(target_os = "linux")]
    {
        if std::path::Path::new("/usr/bin/ptyxis").exists() {
            std::process::Command::new("ptyxis")
                .args(["--new-window", "-T", "Aegis - Actualización del Sistema", "--", "bash", "-c", &full_script])
                .spawn()
                .map_err(|e| format!("Error lanzando Ptyxis: {}", e))?;
            return Ok("Terminal interactiva Ptyxis iniciada para la actualización.".to_string());
        } else if std::path::Path::new("/usr/bin/gnome-terminal").exists() {
            std::process::Command::new("gnome-terminal")
                .args(["--title=Aegis - Actualización del Sistema", "--", "bash", "-c", &full_script])
                .spawn()
                .map_err(|e| format!("Error lanzando GNOME Terminal: {}", e))?;
            return Ok("Terminal interactiva GNOME Terminal iniciada.".to_string());
        } else if std::path::Path::new("/usr/bin/kgx").exists() {
            std::process::Command::new("kgx")
                .args(["-e", &format!("bash -c '{}'", full_script)])
                .spawn()
                .map_err(|e| format!("Error lanzando KGX: {}", e))?;
            return Ok("Terminal interactiva KGX iniciada.".to_string());
        } else if std::path::Path::new("/usr/bin/xterm").exists() {
            std::process::Command::new("xterm")
                .args(["-title", "Aegis - Actualización del Sistema", "-e", "bash", "-c", &full_script])
                .spawn()
                .map_err(|e| format!("Error lanzando xterm: {}", e))?;
            return Ok("Terminal xterm iniciada.".to_string());
        } else {
            std::process::Command::new("xdg-terminal-exec")
                .args(["bash", "-c", &full_script])
                .spawn()
                .map_err(|_| "No se encontró ningún emulador de terminal compatible instalado.".to_string())?;
            return Ok("Terminal iniciada con xdg-terminal-exec.".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("powershell")
            .args(["-NoExit", "-Command", &cmd_str])
            .spawn()
            .map_err(|e| format!("Error lanzando PowerShell: {}", e))?;
        return Ok("Consola PowerShell iniciada.".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!("tell application \"Terminal\" to do script \"{}\"", full_script);
        std::process::Command::new("osascript")
            .args(["-e", &script])
            .spawn()
            .map_err(|e| format!("Error lanzando Terminal macOS: {}", e))?;
        return Ok("Terminal macOS iniciada.".to_string());
    }

    #[allow(unreachable_code)]
    Err("Sistema operativo no soportado para terminal interactiva.".to_string())
}

// ==========================================
// FASE 6.4: GESTOR DE ARRANQUE (AUTOSTART)
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutostartItem {
    pub id: String,
    pub name: String,
    pub exec: String,
    pub item_type: String, // "desktop" | "systemd"
    pub enabled: bool,
    pub source_path: String,
    pub description: Option<String>,
}

#[tauri::command]
pub fn get_autostart_items(force: Option<bool>) -> Result<Vec<AutostartItem>, String> {
    if force != Some(true) {
        if let Ok(guard) = AUTOSTART_CACHE.lock() {
            if let Some((instant, ref items)) = *guard {
                if instant.elapsed().as_secs() < 120 {
                    return Ok(items.clone());
                }
            }
        }
    }

    let mut items = Vec::new();
    let home = get_user_home().unwrap_or_default();

    // 1. Archivos .desktop en ~/.config/autostart
    let autostart_dir = home.join(".config/autostart");
    if autostart_dir.exists() {
        if let Ok(entries) = fs::read_dir(&autostart_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("desktop") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        let id = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let mut name = id.replace(".desktop", "");
                        let mut exec = String::new();
                        let mut enabled = true;
                        let mut desc = None;

                        for line in content.lines() {
                            let line = line.trim();
                            if line.starts_with("Name=") && name == id.replace(".desktop", "") {
                                name = line["Name=".len()..].trim().to_string();
                            } else if line.starts_with("Exec=") {
                                exec = line["Exec=".len()..].trim().to_string();
                            } else if line.starts_with("Comment=") {
                                desc = Some(line["Comment=".len()..].trim().to_string());
                            } else if line.starts_with("X-GNOME-Autostart-enabled=false") || line.starts_with("Hidden=true") {
                                enabled = false;
                            }
                        }

                        items.push(AutostartItem {
                            id,
                            name,
                            exec,
                            item_type: "desktop".to_string(),
                            enabled,
                            source_path: path.to_string_lossy().to_string(),
                            description: desc,
                        });
                    }
                }
            }
        }
    }

    // 2. Servicios de usuario systemd (Linux)
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = std::process::Command::new("systemctl")
            .args(["--user", "list-unit-files", "--type=service", "--state=enabled,disabled", "--no-legend"])
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let service_name = parts[0];
                        let state = parts[1];
                        if service_name.starts_with("app-") || service_name.contains('@') {
                            continue;
                        }
                        let enabled = state == "enabled";
                        let clean_name = service_name.replace(".service", "");

                        items.push(AutostartItem {
                            id: service_name.to_string(),
                            name: clean_name,
                            exec: format!("systemctl --user service ({})", state),
                            item_type: "systemd".to_string(),
                            enabled,
                            source_path: format!("systemd.user:{}", service_name),
                            description: Some(format!("Servicio de usuario systemd ({})", state)),
                        });
                    }
                }
            }
        }
    }

    if let Ok(mut guard) = AUTOSTART_CACHE.lock() {
        *guard = Some((std::time::Instant::now(), items.clone()));
    }

    Ok(items)
}

#[tauri::command]
pub fn toggle_autostart_item(id: String, item_type: String, enable: bool) -> Result<String, String> {
    if let Ok(mut guard) = AUTOSTART_CACHE.lock() {
        *guard = None;
    }

    if item_type == "desktop" {
        let home = get_user_home().ok_or_else(|| "No se pudo resolver directorio home".to_string())?;
        let file_path = home.join(".config/autostart").join(&id);
        if !file_path.exists() {
            return Err(format!("El archivo de inicio {} no existe.", id));
        }

        let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
        let mut new_lines = Vec::new();
        let mut has_gnome = false;
        let mut has_hidden = false;

        for line in content.lines() {
            if line.starts_with("X-GNOME-Autostart-enabled=") {
                new_lines.push(format!("X-GNOME-Autostart-enabled={}", enable));
                has_gnome = true;
            } else if line.starts_with("Hidden=") {
                new_lines.push(format!("Hidden={}", !enable));
                has_hidden = true;
            } else {
                new_lines.push(line.to_string());
            }
        }

        if !has_gnome {
            new_lines.push(format!("X-GNOME-Autostart-enabled={}", enable));
        }
        if !has_hidden {
            new_lines.push(format!("Hidden={}", !enable));
        }

        fs::write(&file_path, new_lines.join("\n")).map_err(|e| e.to_string())?;
        Ok(format!("Aplicación {} {}.", id, if enable { "habilitada" } else { "deshabilitada" }))
    } else if item_type == "systemd" {
        #[cfg(target_os = "linux")]
        {
            let act = if enable { "enable" } else { "disable" };
            let status = std::process::Command::new("systemctl")
                .args(["--user", act, &id])
                .status()
                .map_err(|e| format!("Error ejecutando systemctl: {}", e))?;

            if status.success() {
                Ok(format!("Servicio {} {}.", id, if enable { "habilitado" } else { "deshabilitado" }))
            } else {
                Err(format!("Fallo al cambiar estado de {}", id))
            }
        }
        #[cfg(not(target_os = "linux"))]
        {
            Err("Systemd solo está soportado en Linux.".to_string())
        }
    } else {
        Err(format!("Tipo de item desconocido: {}", item_type))
    }
}
