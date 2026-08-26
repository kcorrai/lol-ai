use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

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
    /// Where the overlay sits and what opens it, read from disk once on the way up.
    ///
    /// Held in memory because the settings are read on every resize — which happens whenever
    /// a panel gains a line during a match — and reading a file at that rate to answer a
    /// question that changes when somebody visits Settings would be work for nothing.
    pub overlay: Mutex<crate::settings::OverlaySettings>,
}

impl AppState {
    /// A copy, never the guard. Nothing in this app should be holding a lock while it talks
    /// to a window, and a settings struct is five small fields.
    ///
    /// A poisoned lock hands back what was in it anyway: the only writer is a player in
    /// Settings, and a panicking one leaves a perfectly readable struct behind. Refusing to
    /// place the overlay for the rest of the session would be the larger failure.
    pub fn overlay(&self) -> crate::settings::OverlaySettings {
        self.overlay.lock().unwrap_or_else(|err| err.into_inner()).clone()
    }

    /// Remembers the new settings, in memory first and then on disk.
    ///
    /// In that order because the in-memory copy is what every later resize reads: a machine
    /// that cannot write the file still honours the choice for as long as the app is open,
    /// and says so rather than appearing to ignore it.
    pub fn set_overlay(
        &self,
        app: AppHandle,
        settings: crate::settings::OverlaySettings,
    ) -> AppResult<()> {
        *self.overlay.lock().unwrap_or_else(|err| err.into_inner()) = settings.clone();
        crate::settings::save(&app, &settings).map_err(crate::error::AppError::Settings)
    }
}

/// What the credential store said when it was asked whether this machine holds a token.
///
/// Three answers, not two. `secrets::read` can say "here it is", "there is no entry" and
/// "I could not be asked", and the third is a different thing from the second: one is the
/// store answering no, the other is the store not answering. Folding them made the app
/// tell a player with a perfectly good token that nothing was stored for it.
#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "status", rename_all = "kebab-case")]
pub enum DeviceStatus {
    Paired,
    NotPaired,
    /// Carries the store's own words, because the only thing the player can act on is why.
    Unknown {
        reason: String,
    },
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

/// The mapping, apart from the command, so it can be tested against a store error — which
/// is the case that was wrong and the one a real credential store will not produce on
/// demand.
fn status_of(read: AppResult<Option<String>>) -> DeviceStatus {
    match read {
        Ok(Some(_)) => DeviceStatus::Paired,
        Ok(None) => DeviceStatus::NotPaired,
        Err(err) => DeviceStatus::Unknown { reason: err.to_string() },
    }
}

/// Whether this device holds a token. Never the token itself.
///
/// Returns rather than fails on a store error: "I could not tell" is an answer the UI
/// draws, and the one thing it must not do is round down to "no".
#[tauri::command]
pub fn device_status() -> DeviceStatus {
    status_of(secrets::read())
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
/// The build comes back with item *names* rather than ids, resolved on the website. Not a
/// content-policy limit — `img-src` admits Data Dragon and the champion list draws from it
/// — but the shape of the answer: the ids are spent server-side and only words cross.
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

/// Never shorter than this, whatever the webview reports.
///
/// A measurement taken while React is still mounting is a small number, and a window that
/// briefly collapses to a sliver over a running game is worse than one that is briefly too
/// tall. This is roughly one panel's header.
const OVERLAY_MIN_HEIGHT: f64 = 96.0;

/// How tall the overlay may be, given what it wants to draw and the room it has.
///
/// Content that fits is honoured exactly; content that does not is cut to the screen rather
/// than drawn past the edge of it — which is still a cut, but one the monitor is making
/// rather than the layout.
///
/// Apart from the command because the command needs a window and a monitor, and this needs
/// two numbers.
fn overlay_height(content: f64, available: f64) -> f64 {
    // A margin that leaves no room would otherwise ask for a negative height. The floor
    // answers that as well as an early measurement.
    content.min(available).max(OVERLAY_MIN_HEIGHT)
}

/// The screen the overlay belongs on, and what is left of it once the taskbar has its share.
///
/// The player names a screen and the name is looked up every time rather than resolved once:
/// a monitor can be unplugged between one toggle and the next, and the answer to that is the
/// screen the window is already on, not no screen at all.
fn overlay_screen(window: &tauri::WebviewWindow, wanted: Option<&str>) -> Option<tauri::window::Monitor> {
    if let Some(name) = wanted {
        if let Ok(monitors) = window.available_monitors() {
            if let Some(found) = monitors
                .into_iter()
                .find(|m| m.name().is_some_and(|n| n == name))
            {
                return Some(found);
            }
        }
    }
    window.current_monitor().ok().flatten()
}

/// Puts the overlay where the settings say, at the height its content asked for.
///
/// Everything here is in physical pixels, deliberately. A machine with one monitor at 150%
/// and another at 100% has two different meanings for a logical pixel, and the window's own
/// scale factor is the one it has *now* rather than the one it is moving to — so a logical
/// position computed for the far screen would land somewhere else. The webview measures in
/// its own units, which is the one number scaled on the way in.
pub(crate) fn place_overlay(
    window: &tauri::WebviewWindow,
    settings: &crate::settings::OverlaySettings,
    content: f64,
) {
    let Some(monitor) = overlay_screen(window, settings.monitor.as_deref()) else {
        return;
    };

    let scale = monitor.scale_factor();
    let area = monitor.work_area();
    let work = crate::settings::Rect {
        x: f64::from(area.position.x),
        y: f64::from(area.position.y),
        width: f64::from(i32::try_from(area.size.width).unwrap_or(0)),
        height: f64::from(i32::try_from(area.size.height).unwrap_or(0)),
    };

    let width = OVERLAY_WIDTH * scale;
    let available = crate::settings::available_height(work.height, settings.dy * scale);
    let height = overlay_height(content * scale, available).max(OVERLAY_MIN_HEIGHT * scale);

    let (x, y) = crate::settings::position_for(
        work,
        settings.corner,
        settings.dx * scale,
        settings.dy * scale,
        (width, height),
    );

    // Size before position: a window that grows after it has been moved would grow past the
    // corner it was measured from, and the bottom corners are measured from an edge that
    // depends on the height.
    let _ = window.set_size(tauri::PhysicalSize::new(width, height));
    let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
}

/// Grows or shrinks the overlay to fit what it is drawing, and keeps it in its corner.
///
/// The overlay is 340x620 in `tauri.conf.json` and its three panels came to 1010 px against
/// a real match, so the last third of the build was off-screen — and the window never takes
/// focus, so nobody could scroll to it either. It takes its height from its content now.
///
/// The webview passes a height and never a window: this names the overlay itself, so the
/// widest thing a renderer can do with it is resize the window it is already drawing, to
/// something the monitor allows. That is also why this is a command rather than a
/// `core:window:allow-set-size` grant in `capabilities/default.json` — that permission
/// would hand the renderer the main window too.
///
/// It repositions as well as resizes, because a window anchored to the bottom of a screen
/// has a top edge that moves every time its content changes height.
///
/// Failures are swallowed rather than raised. A window that would not resize is a window
/// still showing what it showed a moment ago, which is not something to interrupt a match
/// with.
#[tauri::command]
pub fn resize_overlay(app: AppHandle, state: State<'_, AppState>, height: f64) {
    let Some(window) = app.get_webview_window(crate::OVERLAY_WINDOW) else {
        return;
    };

    // Deliberately not skipped while the window is hidden, which is its usual state — it is
    // toggled onto the screen for a glance. The webview measures on mount and when its
    // content changes, and both of those happen behind a hidden window; skipping them would
    // mean the first press of the shortcut in a match showed the window at whatever height
    // it was last left at.
    let settings = state.overlay();
    place_overlay(&window, &settings, height);
}

/// One attached screen, as the Settings list draws it.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
    /// `None` for a screen the operating system does not name. It cannot be chosen — there
    /// would be nothing to save — so the list draws it and disables it.
    pub name: Option<String>,
    pub width: u32,
    pub height: u32,
    pub primary: bool,
}

/// Every screen this machine has, for the picker in Settings.
///
/// Read from the overlay window rather than the main one so a machine where the two ended up
/// on different screens still enumerates the same set — `available_monitors` is the whole
/// set either way, and asking the window that is being placed keeps the two calls honest.
#[tauri::command]
pub fn list_monitors(app: AppHandle) -> Vec<MonitorInfo> {
    let Some(window) = app.get_webview_window(crate::OVERLAY_WINDOW) else {
        return Vec::new();
    };
    let primary = window
        .primary_monitor()
        .ok()
        .flatten()
        .and_then(|m| m.name().cloned());

    window
        .available_monitors()
        .unwrap_or_default()
        .into_iter()
        .map(|m| MonitorInfo {
            primary: m.name().is_some() && m.name().cloned() == primary,
            name: m.name().cloned(),
            width: m.size().width,
            height: m.size().height,
        })
        .collect()
}

/// What opens the overlay and where it sits.
#[tauri::command]
pub fn overlay_settings(state: State<'_, AppState>) -> crate::settings::OverlaySettings {
    state.overlay()
}

/// Changes the key combination that shows and hides the overlay.
///
/// The old one is given up only once the new one has been taken. A player whose choice
/// collides with something else already running keeps the shortcut they had rather than
/// ending up with none — an overlay reachable by neither key nor tray is one they would have
/// to restart the app to get back.
#[tauri::command]
pub fn set_overlay_shortcut(
    app: AppHandle,
    state: State<'_, AppState>,
    accelerator: String,
) -> AppResult<()> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    let current = state.overlay().shortcut;
    if accelerator == current {
        return Ok(());
    }

    app.global_shortcut()
        .register(accelerator.as_str())
        .map_err(|err| crate::error::AppError::Shortcut(err.to_string()))?;
    // Only now: unregistering first would leave a window with no way back if the new
    // combination turned out to be unavailable.
    let _ = app.global_shortcut().unregister(current.as_str());

    let settings = crate::settings::OverlaySettings { shortcut: accelerator, ..state.overlay() };
    state.set_overlay(app, settings)
}

/// Moves the overlay to a screen and a corner of it, and remembers both.
#[tauri::command]
pub fn set_overlay_position(
    app: AppHandle,
    state: State<'_, AppState>,
    monitor: Option<String>,
    corner: crate::settings::Corner,
    dx: f64,
    dy: f64,
) -> AppResult<()> {
    let settings = crate::settings::OverlaySettings {
        monitor,
        corner,
        dx,
        dy,
        ..state.overlay()
    };

    // Applied before it is saved. A player adjusting an offset is looking at the window, and
    // a failure to write the file should not stop it moving where they asked.
    if let Some(window) = app.get_webview_window(crate::OVERLAY_WINDOW) {
        let content = window
            .inner_size()
            .ok()
            .map(|size| f64::from(size.height) / window.scale_factor().unwrap_or(1.0))
            .unwrap_or(OVERLAY_MIN_HEIGHT);
        place_overlay(&window, &settings, content);
    }

    state.set_overlay(app, settings)
}

/// Unchanged from `tauri.conf.json`: this resizes the overlay's height and nothing else.
const OVERLAY_WIDTH: f64 = 340.0;

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::AppError;

    /// The defect this replaced. `is_paired()` was `matches!(read(), Ok(Some(_)))`, so a
    /// store that could not be asked came out as `false` and the app told a player holding
    /// a perfectly good token that nothing was stored for it.
    #[test]
    fn a_store_that_could_not_be_asked_is_not_a_no() {
        let status = status_of(Err(AppError::Keychain("the vault is locked".into())));

        assert!(matches!(status, DeviceStatus::Unknown { .. }));
        assert_ne!(status, DeviceStatus::NotPaired);
    }

    /// "No entry" is the store answering, and answering no.
    #[test]
    fn an_empty_store_is_a_no() {
        assert_eq!(status_of(Ok(None)), DeviceStatus::NotPaired);
    }

    #[test]
    fn a_token_is_a_yes() {
        assert_eq!(status_of(Ok(Some("token".into()))), DeviceStatus::Paired);
    }

    /// The reason is what the player acts on, so it has to survive the mapping.
    #[test]
    fn the_unknown_answer_carries_the_stores_own_words() {
        let status = status_of(Err(AppError::Keychain("the vault is locked".into())));

        let DeviceStatus::Unknown { reason } = status else {
            panic!("expected Unknown");
        };
        assert!(reason.contains("the vault is locked"));
    }

    /// The measurement that started this: three panels came to 1010 px in a 620 px window.
    /// On a 1080p screen with the overlay 96 px from the edge there is room for 984 of it, so
    /// the fit takes what the screen has rather than what the content asked for.
    ///
    /// Where that 984 comes from is `settings::available_height`, which has its own tests —
    /// including the taskbar's share, since `work_area` is what is left of the monitor.
    #[test]
    fn content_taller_than_the_screen_is_cut_by_the_screen() {
        assert_eq!(overlay_height(1010.0, 984.0), 984.0);
    }

    /// The case the window was always in and never used: content that fits is honoured
    /// exactly, rather than being held at the height the config happened to name.
    #[test]
    fn content_that_fits_is_honoured() {
        assert_eq!(overlay_height(430.0, 984.0), 430.0);
        assert_eq!(overlay_height(984.0, 984.0), 984.0);
    }

    /// React mounting, or a margin that leaves the window no room at all. Neither is a reason
    /// to leave a sliver over a running game.
    #[test]
    fn nothing_collapses_the_window_to_a_sliver() {
        assert_eq!(overlay_height(0.0, 984.0), OVERLAY_MIN_HEIGHT);
        assert_eq!(overlay_height(1010.0, 0.0), OVERLAY_MIN_HEIGHT);
    }

    /// The webview matches on this string. A rename here is a rename there.
    #[test]
    fn the_three_answers_serialise_as_the_webview_reads_them() {
        let json = |s: &DeviceStatus| serde_json::to_string(s).unwrap();

        assert_eq!(json(&DeviceStatus::Paired), r#"{"status":"paired"}"#);
        assert_eq!(json(&DeviceStatus::NotPaired), r#"{"status":"not-paired"}"#);
        assert_eq!(
            json(&DeviceStatus::Unknown { reason: "locked".into() }),
            r#"{"status":"unknown","reason":"locked"}"#
        );
    }
}
