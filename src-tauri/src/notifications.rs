use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct NotificationPayload {
    pub title: String,
    pub body: String,
    pub notification_type: Option<String>,
}

#[tauri::command]
pub fn send_desktop_notification(
    app: AppHandle,
    title: String,
    body: String,
    notification_type: Option<String>,
) -> Result<bool, String> {
    // Verificar si el usuario tiene deshabilitada esta categoría en config.json
    if let Ok(cfg) = crate::config::get_aegis_config() {
        if let Some(ref n_type) = notification_type {
            let enabled = match n_type.as_str() {
                "sentinelTempAlert" => cfg.notifications.sentinel_temp_alert,
                "taskDeadlinesAlert" => cfg.notifications.task_deadlines_alert,
                "financeCutoffsAlert" => cfg.notifications.finance_cutoffs_alert,
                "gitBranchAlerts" => cfg.notifications.git_branch_alerts,
                _ => true,
            };
            if !enabled {
                return Ok(false);
            }
        }
    }

    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| format!("Error emitiendo notificación nativa: {}", e))?;

    Ok(true)
}
