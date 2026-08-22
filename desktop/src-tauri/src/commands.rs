use serde::Serialize;
use tauri::State;

use crate::error::AppResult;
use crate::live_client::LiveClient;
use crate::secrets;

pub struct AppState {
    pub live: LiveClient,
}

#[derive(Serialize)]
pub struct DeviceStatus {
    pub paired: bool,
}

/// Reads one Live Client Data API path.
///
/// The webview supplies the path and the client checks it against a fixed list, so the
/// renderer cannot aim this at an endpoint the app is not allowed to call. `None` — a JSON
/// `null` on the other side — means no game is running.
#[tauri::command]
pub async fn live_client_get(
    state: State<'_, AppState>,
    path: String,
) -> AppResult<Option<serde_json::Value>> {
    state.live.get(&path).await
}

/// Whether this device holds a token. Never the token itself.
#[tauri::command]
pub fn device_status() -> DeviceStatus {
    DeviceStatus { paired: secrets::is_paired() }
}

/// Forgets this device locally. Revoking it for real is a server-side act and belongs to
/// the pairing work; this is the half that can be honoured without a backend.
#[tauri::command]
pub fn clear_device_token() -> AppResult<()> {
    secrets::clear()
}
