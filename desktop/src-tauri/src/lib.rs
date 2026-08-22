mod commands;
mod error;
mod live_client;
mod secrets;

use commands::AppState;
use live_client::LiveClient;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Built once and shared: a TLS client that re-reads and re-parses Riot's certificate on
    // every poll would do that work sixty times a minute for the length of a game.
    let live = LiveClient::new().expect("the bundled Riot certificate must parse");

    tauri::Builder::default()
        .manage(AppState { live })
        .invoke_handler(tauri::generate_handler![
            commands::live_client_get,
            commands::device_status,
            commands::clear_device_token,
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
        .expect("error while running tauri application");
}
