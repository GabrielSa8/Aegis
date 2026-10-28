mod agent;
mod vault;
mod devops;
mod finances;
mod sentinel;
mod leisure;
mod config;

#[tauri::command]
fn ping() -> String {
    "Aegis Core Online (Rust / Tauri v2)".into()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ping,
            config::get_aegis_config,
            config::save_aegis_config,
            agent::execute_agent_prompt,
            agent::send_agent_input,
            vault::get_vault_notes,
            vault::read_vault_note,
            vault::save_vault_note,
            vault::get_vault_tasks,
            vault::toggle_vault_task,
            vault::get_vault_stats,
            devops::get_git_fleet_status,
            devops::get_skills_catalog,
            devops::read_skill_markdown,
            finances::sqlite_get_transactions,
            finances::sqlite_save_transaction,
            finances::sqlite_delete_transaction,
            finances::sqlite_get_budgets,
            finances::sqlite_save_budget,
            finances::sqlite_delete_budget,
            finances::sqlite_get_categories,
            finances::sqlite_add_category,
            finances::sqlite_update_category,
            finances::sqlite_delete_category,
            finances::sqlite_get_snapshots,
            finances::sqlite_create_snapshot,
            finances::sqlite_restore_snapshot,
            finances::sqlite_get_timeline_events,
            finances::sqlite_save_timeline_event,
            finances::sqlite_toggle_timeline_event,
            finances::sqlite_delete_timeline_event,
            finances::sqlite_export_backup,
            finances::sqlite_import_backup,
            sentinel::get_system_telemetry,
            sentinel::get_system_alerts,
            sentinel::get_top_processes,
            sentinel::kill_process,
            sentinel::clean_system_memory,
            leisure::get_gaming_status,
            leisure::get_installed_steam_games,
            leisure::launch_game
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
