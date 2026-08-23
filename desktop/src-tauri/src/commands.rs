use serde::Serialize;
use tauri::State;

use crate::api::{ApiClient, Pairing};
use crate::error::AppResult;
use crate::live_client::LiveClient;
use crate::live_context::{LiveContext, LiveContextRequest};
use crate::secrets;

pub struct AppState {
    pub live: LiveClient,
    pub api: ApiClient,
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

/// Exchange a pairing code for this machine's own token.
///
/// The exchange happens here rather than in the webview for one reason: the response
/// carries the token, and this is where it can be written to the credential store without
/// ever existing in a browser context. What comes back to the UI is the account it belongs
/// to — enough to say who you are signed in as, and nothing that could be replayed.
#[tauri::command]
pub async fn pair_device(state: State<'_, AppState>, code: String) -> AppResult<Pairing> {
    let platform = crate::api::platform()?;
    let label = crate::api::machine_label();
    state.api.pair(code.trim(), &label, platform).await
}

/// Who this machine is acting as, or `null` when it is not paired.
///
/// Also how the app notices it has been revoked: the website answers 401, the token is
/// forgotten locally, and this returns `null` — which is the pairing screen.
#[tauri::command]
pub async fn device_account(state: State<'_, AppState>) -> AppResult<Option<Pairing>> {
    state.api.me().await
}

/// What the website knows about the game on this screen, or `null` when this machine is no
/// longer paired.
///
/// The request goes through the core rather than from the webview for the same reason the
/// pairing exchange does: it has to carry the device token, and the token is not allowed to
/// exist in a browser context (ADR-038). The webview supplies what it read off the game and
/// gets back a reading it could not have obtained itself.
#[tauri::command]
pub async fn live_context(
    state: State<'_, AppState>,
    request: LiveContextRequest,
) -> AppResult<Option<LiveContext>> {
    state.api.live_context(&request).await
}
