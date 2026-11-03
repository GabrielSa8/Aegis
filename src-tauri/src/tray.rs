use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let show_i = MenuItem::with_id(app, "show", "🛡️ Mostrar Aegis", true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", "Ocultar en Bandeja", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Salir de Aegis", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_i, &hide_i, &sep1, &quit_i])?;

    let icon = match app.default_window_icon() {
        Some(i) => i.clone(),
        None => return Err("No se encontró ícono por defecto para el System Tray".into()),
    };

    let _tray = TrayIconBuilder::with_id("aegis-tray")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Aegis — Centro de Mando Maestro")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let is_vis = window.is_visible().unwrap_or(false);
                    let is_min = window.is_minimized().unwrap_or(false);
                    if is_vis && !is_min {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[tauri::command]
pub fn toggle_window_visibility(app: AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_vis = window.is_visible().unwrap_or(false);
        let is_min = window.is_minimized().unwrap_or(false);
        if is_vis && !is_min {
            let _ = window.hide();
            Ok(false)
        } else {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
            Ok(true)
        }
    } else {
        Err("Ventana principal no encontrada".to_string())
    }
}
