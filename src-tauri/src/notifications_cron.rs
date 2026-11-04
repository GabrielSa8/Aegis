use std::collections::HashSet;
use std::sync::Mutex;
use std::time::Duration;
use tauri::AppHandle;

static NOTIFIED_ALERTS: Mutex<Option<HashSet<String>>> = Mutex::new(None);

fn is_already_notified(key: &str) -> bool {
    let mut lock = NOTIFIED_ALERTS.lock().unwrap();
    if lock.is_none() {
        *lock = Some(HashSet::new());
    }
    let set = lock.as_mut().unwrap();
    if set.contains(key) {
        true
    } else {
        set.insert(key.to_string());
        false
    }
}

pub fn spawn_notification_cron(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // Pausa inicial para que la app cargue completamente
        tokio::time::sleep(Duration::from_secs(10)).await;

        loop {
            run_cron_checks(&app);
            // Ejecutar cada 5 minutos
            tokio::time::sleep(Duration::from_secs(300)).await;
        }
    });
}

fn run_cron_checks(app: &AppHandle) {
    let cfg = match crate::config::get_aegis_config() {
        Ok(c) => c,
        Err(_) => return,
    };

    let today = chrono_like_today();

    // 1. Tareas próximas a vencer o vencidas hoy (taskDeadlinesAlert)
    if cfg.notifications.task_deadlines_alert {
        check_task_deadlines(app, &today);
    }

    // 2. Cortes de tarjetas y finanzas (financeCutoffsAlert)
    if cfg.notifications.finance_cutoffs_alert {
        check_finance_cutoffs(app, &today);
    }

    // 3. Alertas térmicas (> 85°C) de Centinela (sentinelTempAlert)
    if cfg.notifications.sentinel_temp_alert {
        check_sentinel_temperature(app);
    }
}

fn check_task_deadlines(app: &AppHandle, today: &str) {
    if let Ok(tasks) = crate::vault::get_vault_tasks() {
        let mut urgent_count = 0;
        let mut sample_task = String::new();

        for t in tasks {
            if t.completed {
                continue;
            }
            // Parsear fecha 📅 YYYY-MM-DD
            if let Some(pos) = t.text.find("📅") {
                let after = &t.text[pos + "📅".len()..];
                let date_cand = after.trim().split_whitespace().next().unwrap_or("");
                if !date_cand.is_empty() && date_cand <= today {
                    urgent_count += 1;
                    if sample_task.is_empty() {
                        sample_task = t.text.replace("📅", "").trim().to_string();
                        if sample_task.len() > 60 {
                            sample_task.truncate(57);
                            sample_task.push_str("...");
                        }
                    }
                }
            } else if t.text.contains("#urgente") || t.text.contains("#hoy") || t.text.contains("🔺") || t.text.contains("⏫") {
                urgent_count += 1;
                if sample_task.is_empty() {
                    sample_task = t.text.trim().to_string();
                    if sample_task.len() > 60 {
                        sample_task.truncate(57);
                        sample_task.push_str("...");
                    }
                }
            }
        }

        if urgent_count > 0 {
            let alert_key = format!("tasks_{}_{}", today, urgent_count);
            if !is_already_notified(&alert_key) {
                let title = if urgent_count == 1 {
                    "📋 Aegis Tareas: 1 compromiso para hoy".to_string()
                } else {
                    format!("📋 Aegis Tareas: {} compromisos pendientes hoy", urgent_count)
                };
                let body = if !sample_task.is_empty() {
                    format!("Próximo: {}", sample_task)
                } else {
                    "Revisa la Pestaña de Tareas para planificar tu jornada.".to_string()
                };
                let _ = crate::notifications::send_desktop_notification(
                    app.clone(),
                    title,
                    body,
                    Some("taskDeadlinesAlert".to_string()),
                );
            }
        }
    }
}

fn check_finance_cutoffs(app: &AppHandle, today: &str) {
    let day_number: u32 = match today.split('-').nth(2).and_then(|d| d.parse().ok()) {
        Some(d) => d,
        None => return,
    };

    if let Ok(methods) = crate::finances::sqlite_get_payment_methods() {
        for m in methods {
            if let Some(cutoff) = m.cutoff_day {
                let diff = (cutoff as i64) - (day_number as i64);
                // Si faltan entre 0 y 2 días para el corte
                if diff >= 0 && diff <= 2 {
                    let alert_key = format!("cutoff_{}_{}_{}", m.id, today, diff);
                    if !is_already_notified(&alert_key) {
                        let title = format!("💳 Corte Próximo: {}", m.name);
                        let body = if diff == 0 {
                            format!("¡Hoy es la fecha de corte de {}!", m.name)
                        } else {
                            format!("El corte de {} es en {} días (Día {}).", m.name, diff, cutoff)
                        };
                        let _ = crate::notifications::send_desktop_notification(
                            app.clone(),
                            title,
                            body,
                            Some("financeCutoffsAlert".to_string()),
                        );
                    }
                }
            }
        }
    }
}

fn check_sentinel_temperature(app: &AppHandle) {
    if let Ok(telemetry) = crate::sentinel::get_system_telemetry() {
        if telemetry.cpu_temp_celsius >= 85.0 {
            let alert_key = format!("temp_{:.0}", telemetry.cpu_temp_celsius);
            if !is_already_notified(&alert_key) {
                let _ = crate::notifications::send_desktop_notification(
                    app.clone(),
                    "🔥 Alerta Térmica: CPU Crítica".to_string(),
                    format!("La temperatura ha alcanzado {:.1}°C. Se recomienda activar purga o reducir carga.", telemetry.cpu_temp_celsius),
                    Some("sentinelTempAlert".to_string()),
                );
            }
        }
    }
}

fn chrono_like_today() -> String {
    if let Ok(output) = std::process::Command::new("date").arg("+%Y-%m-%d").output() {
        if let Ok(s) = String::from_utf8(output.stdout) {
            let trimmed = s.trim().to_string();
            if !trimmed.is_empty() {
                return trimmed;
            }
        }
    }
    "2026-10-27".to_string()
}
