use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::api::{base_url, read, ApiClient};
use crate::error::{AppError, AppResult};

/// The post-game handoff (ADR-038, phase 5).
///
/// Two things, and they are separate on purpose. Telling the website a game has ended is a
/// network call that must happen whether or not anyone is looking at the app; sending the
/// player to their report is something they ask for by clicking.
///
/// Mirrors `src/domains/desktop/contract.ts` by hand, like the rest of ADR-038 K6.

/// What came of reporting a finished game.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PostGame {
    /// `pending`, `already_running` or `no_riot_account`. A string rather than an enum for
    /// the reason the live dashboard's fields are: a case this build has never heard of
    /// must not become a parse failure the player cannot do anything about.
    pub status: String,
    /// Null only when the account behind this device has no Riot account linked.
    pub riot_account_id: Option<String>,
}

/// Where the player is sent to read the game they just played.
///
/// Built here from the compiled-in base rather than accepted from the webview or from the
/// website's answer. Opening a URL is the one capability in this app that reaches outside
/// it, and the set of addresses it can reach should be decided at build time by the same
/// constant that decides where the device token is sent.
pub fn report_url() -> String {
    format!("{}/matches", base_url())
}

/// Hands the report to the operating system's default browser.
///
/// Deliberately not a webview navigation: this window is a companion to a running game and
/// must not become a browser. The plugin's own commands are not granted to the renderer,
/// so `report_url` is the only address this app can open.
pub fn open_report(app: &AppHandle) -> AppResult<()> {
    app.opener()
        .open_url(report_url(), None::<&str>)
        .map_err(|e| AppError::Browser(e.to_string()))
}

impl ApiClient {
    /// Tell the website a game has ended, so this account is pulled from Riot now rather
    /// than the next time somebody opens the dashboard.
    ///
    /// `Ok(None)` means this machine is no longer paired — the same state, and the same
    /// handling, as everywhere else the device token is used.
    pub async fn post_game(&self) -> AppResult<Option<PostGame>> {
        let Some(token) = crate::secrets::read()? else {
            return Ok(None);
        };

        let response = self
            .http
            .post(format!("{}/api/desktop/post-game", base_url()))
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            crate::secrets::clear()?;
            return Ok(None);
        }

        read(response).await.map(Some)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_answer_matches_the_contract() {
        let parsed: PostGame = serde_json::from_value(serde_json::json!({
            "status": "pending",
            "riotAccountId": "22222222-2222-2222-2222-222222222222"
        }))
        .unwrap();

        assert_eq!(parsed.status, "pending");
        assert_eq!(
            parsed.riot_account_id.unwrap(),
            "22222222-2222-2222-2222-222222222222"
        );
    }

    /// A machine can be paired before an account is linked, and the app has to say so
    /// rather than reporting a sync it did not get.
    fn parse(status: &str, id: serde_json::Value) -> PostGame {
        serde_json::from_value(serde_json::json!({ "status": status, "riotAccountId": id })).unwrap()
    }

    #[test]
    fn a_device_with_no_linked_account_parses() {
        let parsed = parse("no_riot_account", serde_json::Value::Null);
        assert!(parsed.riot_account_id.is_none());
    }

    #[test]
    fn a_sync_already_running_parses() {
        let parsed = parse("already_running", serde_json::json!("account-1"));
        assert_eq!(parsed.status, "already_running");
    }

    /// The reason `status` is a string. A website that starts answering with a fourth case
    /// must not leave the app unable to read its own answer.
    #[test]
    fn a_status_this_build_has_never_heard_of_still_parses() {
        assert_eq!(parse("queued", serde_json::Value::Null).status, "queued");
    }

    /// The address is built here, so a compromised renderer cannot choose what the app
    /// opens in the player's browser.
    #[test]
    fn the_report_url_is_on_the_compiled_in_host() {
        let url = report_url();
        assert!(url.starts_with(base_url()));
        assert!(url.ends_with("/matches"));
    }
}
