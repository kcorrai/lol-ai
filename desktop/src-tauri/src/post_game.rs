use serde::{Deserialize, Serialize};

use crate::api::{base_url, read, ApiClient};
use crate::error::{AppError, AppResult};

/// The post-game handoff (ADR-038, phase 5).
///
/// Telling the website a game has ended: a network call that must happen whether or not
/// anyone is looking at the app. Reading the game afterwards is not here — `/matches` is a
/// screen in this window, so the panel's button is a navigation and needs no core at all.
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
}
