mod api;
mod commands;
mod error;
mod live_client;
mod live_context;
mod post_game;
mod secrets;

use api::ApiClient;
use commands::AppState;
use live_client::LiveClient;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WindowEvent};

/// The one window this app has had since phase 1. Named rather than repeated so the tray,
/// the close handler and the second-instance hook cannot drift apart.
const MAIN_WINDOW: &str = "main";

/// Brings the window back and focuses it, creating nothing: the window always exists, it
/// is only ever hidden. Silently does nothing if it has genuinely gone, because failing to
/// raise a window is not worth taking the process down over.
fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Built once and shared: a TLS client that re-reads and re-parses Riot's certificate on
    // every poll would do that work sixty times a minute for the length of a game.
    let live = LiveClient::new().expect("the bundled Riot certificate must parse");
    let api = ApiClient::new().expect("the HTTP client must build");

    tauri::Builder::default()
        // First, and it has to be: the plugin works by having the second process hand its
        // arguments to the first and exit, and anything registered before it would run in
        // that doomed process. A second copy would poll 2999 alongside the first and hold
        // its own handle on the credential store.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Launching it again is how a player asks for the window back once the app has
            // gone to the tray, so that is what it does.
            show_main(app);
        }))
        // Off unless the player turns it on in Settings. `MacosLauncher` is required by the
        // plugin's signature on every platform and ignored off macOS; no arguments are
        // passed, so a start-up launch is the same launch as any other.
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        // Registered for the Rust side only: none of the plugin's own commands are granted
        // to the webview, so the sole address this app can open is the one `open_report`
        // builds from the compiled-in base.
        .plugin(tauri_plugin_opener::init())
        .manage(AppState { live, api })
        .invoke_handler(tauri::generate_handler![
            commands::live_client_get,
            commands::device_status,
            commands::clear_device_token,
            commands::pair_device,
            commands::device_account,
            commands::live_context,
            commands::post_game,
            commands::open_report,
        ])
        // Closing the window puts the app in the tray rather than ending it. The whole
        // point of this process is to be running when a game starts, and a player who
        // closes the window between matches has not asked to stop being coached — Quit,
        // on the tray menu, is how they say that.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == MAIN_WINDOW {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let open = MenuItem::with_id(app, "open", "Open LoL AI Coach", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().ok_or(
                    "the bundle must carry a window icon for the tray to reuse",
                )?)
                .tooltip("LoL AI Coach")
                .menu(&menu)
                // The menu is for the right button; a left click is the shortcut everyone
                // expects, and showing the menu on both makes the common action the slow one.
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main(app),
                    // The only way out. Deliberately explicit, because closing the window
                    // no longer is one.
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
