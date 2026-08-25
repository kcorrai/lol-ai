use serde::Serialize;
use tauri::{AppHandle, State};

use crate::api::{ApiClient, Pairing};
use crate::champions::{ChampionDetail, ChampionList};
use crate::error::AppResult;
use crate::lcu::{Endpoint, LcuClient, PerkPage};
use crate::live_client::LiveClient;
use crate::live_context::{LiveContext, LiveContextRequest};
use crate::post_game::PostGame;
use crate::proxy::ProxyResponse;
use crate::secrets;

pub struct AppState {
    pub live: LiveClient,
    pub api: ApiClient,
    pub lcu: LcuClient,
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

/// One lane's champions, or `null` when this machine is no longer paired.
///
/// Through the core for the same reason every other website call is: the endpoint wants the
/// device token, and the token is not allowed to exist in a browser context (ADR-038). What
/// this answers is not personal — it is the patch's own numbers — but the credential that
/// fetches it is.
#[tauri::command]
pub async fn champion_list(
    state: State<'_, AppState>,
    position: String,
) -> AppResult<Option<ChampionList>> {
    state.api.champions(&position).await
}

/// One champion in one lane, or `null` when this machine is no longer paired.
///
/// The build comes back with item *names* rather than ids, resolved on the website: this
/// window's content policy allows images from itself and `data:` alone, so a Data Dragon
/// icon URL would render as a broken frame.
///
/// `key` is a Data Dragon id — `Ahri`, `MonkeyKing` — and reaches the address through
/// `Url`, which escapes it into a single path segment.
#[tauri::command]
pub async fn champion_detail(
    state: State<'_, AppState>,
    key: String,
    position: String,
) -> AppResult<Option<ChampionDetail>> {
    state.api.champion(key.trim(), &position).await
}

/// Tell the website a game has ended, or `null` when this machine is no longer paired.
///
/// Takes no argument: what game it was is something the website reads from Riot, and the
/// account it belongs to is read from the device row rather than named here. All the app
/// contributes is the timing, which is the one thing it knows and the website does not.
#[tauri::command]
pub async fn post_game(state: State<'_, AppState>) -> AppResult<Option<PostGame>> {
    state.api.post_game().await
}

/// Reads one allowlisted path on the website, with the device token attached.
///
/// The one command behind every screen that is the website's own (ADR-043). Same shape as
/// `live_client_get` above and for the same reason: the webview names the path, the client
/// checks it against a fixed list in `proxy::ALLOWED_PREFIXES`, and what comes back is
/// unparsed JSON. That is what lets a page be added without a Rust struct mirroring its
/// wire contract — and so without the mirror silently dropping a field nobody added twice.
///
/// `None` — a JSON `null` on the other side — means this machine holds no token.
#[tauri::command]
pub async fn desktop_fetch(
    state: State<'_, AppState>,
    path: String,
    method: String,
    body: Option<serde_json::Value>,
) -> AppResult<Option<ProxyResponse>> {
    state.api.proxy(&path, &method, body).await
}

/// Opens the player's match list in their own browser.
///
/// The address is built in `post_game::report_url` from the compiled-in base, so this
/// command takes no URL — a renderer that could pass one could send the player anywhere.
/// Not a navigation inside this window either: a companion to a running game must not turn
/// itself into a browser.
#[tauri::command]
pub fn open_report(app: AppHandle) -> AppResult<()> {
    crate::post_game::open_report(&app)
}

/// Opens one page of the website in the player's own browser (ADR-044).
///
/// Unlike `open_report` this does take a path, because the pages it reaches are not known
/// at build time — they are whatever the companion does not cover, which is most of the
/// site and is meant to stay that way. What it does not take is a host: `website::open`
/// builds the address on the compiled-in base, so the widest thing a renderer can ask for
/// is a different page of this same site. `website::is_page` refuses the rest.
#[tauri::command]
pub fn open_on_website(app: AppHandle, path: String) -> AppResult<()> {
    crate::website::open(&app, &path)
}

// ── Champion select, behind the LCU capability (ADR-038) ─────────────────────
//
// Every one of these answers `AppError::LcuDisabled` unless the crate was built
// with the `lcu` feature, which it is not by default. Riot does not support the
// League Client API for third-party applications and requires pre-release
// approval for every release and every update; a build without the feature
// cannot reach it at all.
//
// There is no automation here and there will not be. Accepting a queue, picking
// a champion or banning one is input taken on the player's behalf, which is
// Riot's own definition of scripting.

/// Whether this build can talk to the League client at all.
///
/// Asked before anything else so the UI can say "not in this build" rather than
/// rendering a champion select panel that could only ever be empty.
#[tauri::command]
pub fn lcu_available() -> bool {
    crate::lcu::ENABLED
}

/// The current champion select session, or `None` when there is not one.
///
/// Handed to the webview as the client's own JSON. Nothing is derived here about
/// who the other players are: Riot requires non-party names in ranked champion
/// select to be shown as "Ally 1" and so on, and the renderer is what honours
/// that — this command adds no identity the client did not already publish.
#[tauri::command]
pub async fn lcu_champ_select(
    state: State<'_, AppState>,
) -> AppResult<Option<serde_json::Value>> {
    state.lcu.get(Endpoint::ChampSelectSession).await
}

/// Writes one rune page into the client.
///
/// The page is computed on the website by `getChampionBuild` and carried here;
/// this app works out no runes of its own. `false` means the client is not
/// running, which is not a fault.
#[tauri::command]
pub async fn lcu_apply_runes(state: State<'_, AppState>, page: PerkPage) -> AppResult<bool> {
    state.lcu.put_perk_page(&page).await
}
