mod agent;
mod db;
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
            agent::sqlite_get_chat_sessions,
            agent::sqlite_save_chat_session,
            agent::sqlite_delete_chat_session,
            agent::sqlite_get_chat_messages,
            agent::sqlite_save_chat_message,
            vault::get_vault_notes,
            vault::read_vault_note,
            vault::save_vault_note,
            vault::get_vault_tasks,
            vault::toggle_vault_task,
            vault::get_vault_stats,
            vault::search_vault_content,
            vault::create_vault_note,
            vault::create_vault_folder,
            vault::delete_vault_note,
            vault::get_vault_folders,
            devops::get_git_fleet_status,
            devops::get_git_repo_details,
            devops::git_fetch_repo,
            devops::git_pull_repo,
            devops::git_checkout_branch,
            devops::open_repo_in_editor,
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
            finances::sqlite_get_payment_methods,
            finances::sqlite_save_payment_method,
            finances::sqlite_delete_payment_method,
            finances::sqlite_get_msi_plans,
            finances::sqlite_save_msi_plan,
            finances::sqlite_pay_msi_installment,
            finances::sqlite_delete_msi_plan,
            finances::sqlite_get_recurring_expenses,
            finances::sqlite_save_recurring_expense,
            finances::sqlite_approve_recurring_expense,
            finances::sqlite_delete_recurring_expense,
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
