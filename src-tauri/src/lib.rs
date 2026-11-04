mod agent;
mod db;
mod vault;
mod devops;
mod finances;
mod sentinel;
mod leisure;
mod config;
mod cortex;
mod tray;
mod notifications;
mod backup;

#[tauri::command]
fn ping() -> String {
    "Aegis Core Online (Rust / Tauri v2)".into()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            ping,
            config::get_aegis_config,
            config::save_aegis_config,
            config::get_storage_stats,
            config::purge_app_caches,
            agent::execute_agent_prompt,
            agent::send_agent_input,
            agent::cancel_agent_stream,
            agent::sqlite_get_chat_sessions,
            agent::sqlite_save_chat_session,
            agent::sqlite_delete_chat_session,
            agent::sqlite_get_chat_messages,
            agent::sqlite_save_chat_message,
            agent::sqlite_get_token_usage_telemetry,
            agent::execute_provider_command,
            agent::save_attachment,
            agent::import_attachment,
            agent::list_workspace_files,
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
            vault::delete_vault_item,
            vault::get_vault_folders,
            vault::move_vault_item,
            vault::rename_vault_item,
            vault::get_vault_note_network,
            devops::get_git_fleet_status,
            devops::get_git_repo_details,
            devops::git_fetch_repo,
            devops::git_pull_repo,
            devops::git_checkout_branch,
            devops::open_repo_in_editor,
            devops::get_skills_catalog,
            devops::read_skill_markdown,
            devops::save_skill_markdown,
            devops::delete_agent_skill,
            devops::install_agent_skill,
            devops::get_github_workflow_runs,
            devops::get_github_pull_requests,
            devops::get_github_repo_metadata,
            devops::trigger_github_workflow,
            devops::add_fleet_repo,
            devops::remove_fleet_repo,
            devops::delete_fleet_repo,
            devops::create_fleet_repo,
            devops::get_dev_daemons_status,
            devops::restart_adb_server,
            devops::toggle_container_state,
            devops::create_container,
            devops::delete_container,
            devops::get_container_logs,
            devops::stop_dev_server_process,
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
            sentinel::set_power_profile,
            sentinel::scan_cleanable_targets,
            sentinel::purge_cleanable_target,
            sentinel::purge_all_cleanable_targets,
            sentinel::check_system_updates,
            sentinel::launch_system_update,
            sentinel::get_autostart_items,
            sentinel::toggle_autostart_item,
            leisure::get_gaming_status,
            leisure::get_installed_steam_games,
            leisure::launch_game,
            leisure::cancel_game_session,
            leisure::sqlite_get_custom_games,
            leisure::sqlite_save_custom_game,
            leisure::sqlite_delete_custom_game,
            leisure::sqlite_record_game_session,
            leisure::record_game_session,
            leisure::get_game_stats,
            leisure::get_all_game_stats,
            leisure::get_game_sessions,
            leisure::get_game_achievements,
            leisure::create_custom_achievement,
            leisure::toggle_custom_achievement,
            leisure::toggle_game_achievement,
            leisure::delete_custom_achievement,
            leisure::save_game_review_and_sync,
            leisure::get_game_agent_context,
            leisure::save_game_companion_note,
            cortex::cortex_record_signal,
            cortex::cortex_get_telemetry,
            cortex::cortex_resolve_proposal,
            tray::toggle_window_visibility,
            notifications::send_desktop_notification,
            backup::create_system_backup,
            backup::list_system_backups,
            backup::restore_system_backup
        ])
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Inicializar System Tray
            if let Err(e) = tray::create_tray(app.handle()) {
                eprintln!("[Aegis Tray Warning]: No se pudo inicializar tray icon: {}", e);
            }

            // Si el usuario configuró iniciar minimizado
            if let Ok(cfg) = config::get_aegis_config() {
                if cfg.start_minimized {
                    use tauri::Manager;
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.hide();
                    }
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if let Ok(cfg) = config::get_aegis_config() {
                    if cfg.close_to_tray {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
