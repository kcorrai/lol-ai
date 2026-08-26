mod api;
mod champions;
mod commands;
mod error;
mod lcu;
mod live_client;
mod live_context;
mod post_game;
mod proxy;
mod secrets;
mod settings;
mod website;

use api::ApiClient;
use commands::AppState;
use lcu::LcuClient;
use live_client::LiveClient;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

/// The window this app has had since phase 1. Named rather than repeated so the tray,
/// the close handler and the second-instance hook cannot drift apart.
const MAIN_WINDOW: &str = "main";

/// The frameless, transparent one that sits over the game.
///
/// `pub(crate)` because `commands::resize_overlay` names it rather than taking a window
/// from the renderer: the webview chooses a height and never which window gets it.
pub(crate) const OVERLAY_WINDOW: &str = "overlay";

/// The label under the tray's overlay item, which now has to name a shortcut nobody can
/// predict at compile time.
///
/// Tauri writes accelerators as `CmdOrCtrl+Alt+L`; a menu is read by a person. Splitting on
/// the separator and rejoining keeps whatever the player chose without this needing to know
/// the vocabulary — a combination this function has never heard of still reads correctly.
fn overlay_menu_label(accelerator: &str) -> String {
    format!("Toggle overlay ({})", accelerator.replace("CmdOrCtrl", "Ctrl"))
}

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

/// Shows the overlay if it is hidden and hides it if it is not.
///
/// Never focused. Taking focus from a running game is taking the player's hands off it,
/// and this window has nothing to type into — it is read, not used.
fn toggle_overlay(app: &AppHandle) {
    let Some(window) = app.get_webview_window(OVERLAY_WINDOW) else {
        return;
    };
    match window.is_visible() {
        Ok(true) => {
            let _ = window.hide();
        }
        // An unreadable visibility is treated as hidden: the failure a player can act on
        // is a window that will not appear, not one that appears twice.
        _ => {
            let _ = window.show();
            // Re-asserted on every show. Another always-on-top window that appeared later
            // would otherwise sit over this one for the rest of the session.
            let _ = window.set_always_on_top(true);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Built once and shared: a TLS client that re-reads and re-parses Riot's certificate on
    // every poll would do that work sixty times a minute for the length of a game.
    let live = LiveClient::new().expect("the bundled Riot certificate must parse");
    let api = ApiClient::new().expect("the HTTP client must build");
    // Built whether or not the capability is on: the client is inert without the feature,
    // and building it unconditionally keeps one shape of `AppState` rather than two.
    let lcu = LcuClient::new().expect("the HTTP client must build");

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
        // to the webview. Every address this app can open is built in Rust on the
        // compiled-in base — `open_report` from a constant, `open_on_website` from a path
        // the renderer supplies and `website::is_page` refuses if it could name a host.
        .plugin(tauri_plugin_opener::init())
        // `setup` replaces this with what is on disk — the first place with an `AppHandle` to
        // find the file with. Defaults until then, so a settings file that cannot be read is
        // a machine that has never been asked rather than a machine with no settings at all.
        .manage(AppState {
            live,
            api,
            lcu,
            overlay: std::sync::Mutex::new(settings::OverlaySettings::default()),
        })
        .invoke_handler(tauri::generate_handler![
            commands::live_client_get,
            commands::device_status,
            commands::clear_device_token,
            commands::pair_device,
            commands::device_account,
            commands::live_context,
            commands::champion_list,
            commands::champion_detail,
            commands::post_game,
            commands::desktop_fetch,
            commands::open_report,
            commands::open_on_website,
            commands::lcu_available,
            commands::lcu_champ_select,
            commands::lcu_apply_runes,
            commands::resize_overlay,
            commands::overlay_settings,
            commands::set_overlay_shortcut,
            commands::set_overlay_position,
            commands::list_monitors,
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
            // Read before anything that depends on it: the shortcut this registers and the
            // corner the overlay is placed in both come out of this file, and both happen
            // once, here.
            let saved = settings::load(app.handle());
            {
                let state = app.state::<AppState>();
                *state.overlay.lock().unwrap_or_else(|err| err.into_inner()) = saved.clone();
            }

            // The window is where `tauri.conf.json` put it until this moves it. That position
            // is also the default, so a machine that has never opened Settings sees no jump.
            if let Some(window) = app.get_webview_window(OVERLAY_WINDOW) {
                let height = window
                    .inner_size()
                    .ok()
                    .map(|size| f64::from(size.height) / window.scale_factor().unwrap_or(1.0))
                    .unwrap_or(0.0);
                commands::place_overlay(&window, &saved, height);
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Registered in Rust and never granted to the webview: a renderer that could
            // claim arbitrary global shortcuts could take keys away from the game.
            //
            // A shortcut that will not register is not fatal — the tray menu reaches the
            // overlay too — so this warns rather than refusing to start. Another
            // application already holding the combination is the ordinary cause.
            {
                use tauri_plugin_global_shortcut::{Builder, ShortcutState};

                app.handle().plugin(
                    Builder::new()
                        .with_handler(|app, _shortcut, event| {
                            // Presses only. Without this the overlay toggles twice per tap
                            // and never appears to move.
                            if event.state() == ShortcutState::Pressed {
                                toggle_overlay(app);
                            }
                        })
                        .build(),
                )?;

                let shortcut = saved.shortcut.clone();
                if let Err(err) = app.global_shortcut().register(shortcut.as_str()) {
                    log::warn!(
                        "could not register {shortcut} for the overlay; \
                         the tray menu still reaches it: {err}"
                    );
                }
            }

            let open = MenuItem::with_id(app, "open", "Open LoL AI Coach", true, None::<&str>)?;
            let overlay = MenuItem::with_id(
                app,
                "overlay",
                overlay_menu_label(&saved.shortcut),
                true,
                None::<&str>,
            )?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &overlay, &quit])?;

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
                    "overlay" => toggle_overlay(app),
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

#[cfg(test)]
mod tests {
    use super::*;

    /// What the tray said before it could say anything else, so the default still reads the
    /// way it always did.
    #[test]
    fn the_default_reads_as_it_always_has() {
        assert_eq!(
            overlay_menu_label(settings::DEFAULT_SHORTCUT),
            "Toggle overlay (Ctrl+Alt+L)"
        );
    }

    /// A combination this function has never heard of still reaches the menu intact. The
    /// alternative — a table of names — would be one more place to forget a key.
    #[test]
    fn a_shortcut_it_does_not_know_survives_the_trip() {
        assert_eq!(
            overlay_menu_label("Alt+Shift+F9"),
            "Toggle overlay (Alt+Shift+F9)"
        );
    }
}
