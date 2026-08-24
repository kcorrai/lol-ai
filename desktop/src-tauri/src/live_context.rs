use serde::{Deserialize, Serialize};

use crate::api::{base_url, read, ApiClient};
use crate::error::{AppError, AppResult};

/// The live dashboard's half of the website contract (ADR-038, phase 4).
///
/// It lives in its own module rather than beside the pairing structs for one reason: this
/// is the only call the app makes *during a game*, and everything about it — that it may
/// fail without the app minding, that its answer is read once per matchup and not per poll
/// — is different from the pairing exchange, which happens once and must not fail quietly.
///
/// Mirrors `src/domains/desktop/contract.ts` by hand, like the rest of ADR-038 K6. The
/// tests at the bottom are what keep the mirror honest.

/// What the app can see of the game it is watching.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveContextRequest {
    pub champion_name: String,
    /// Null is routine: ARAM has no lane, and a lane nobody can name has no opponent.
    pub opponent_champion_name: Option<String>,
    pub position: Option<String>,
    pub game_mode: String,
}

/// A champion both sides agree on — resolved against Data Dragon by the website, never as
/// the game client spelled it.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveChampion {
    pub key: String,
    pub name: String,
}

/// This account's own record in this matchup.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonalMatchup {
    pub games: i64,
    pub wins: i64,
    pub win_rate: f64,
    pub avg_kda: f64,
    /// A string rather than an enum, and the same goes for `verdict` and `severity` below.
    /// The website may add a case before this build is replaced, and a value this app has
    /// not heard of must not turn into a parse failure that blanks the panel mid-game — the
    /// same rule the Live Client Data schemas follow. The UI decides what it can render.
    pub trend: String,
}

/// What the patch-current snapshot says about the same matchup, for everyone.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetaMatchup {
    pub position: String,
    pub patch: String,
    pub win_rate: f64,
    pub games: i64,
    pub verdict: String,
    pub hints: Vec<String>,
}

/// One recurring weakness, already detected from this account's own matches.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Habit {
    pub habit_type: String,
    pub display_name: String,
    pub severity: String,
    pub message: String,
}

/// What this account normally does on the champion it is playing right now.
///
/// The companion measures the same four things off the Live Client Data API while the game
/// runs, so this is the only half it cannot work out for itself.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveBaseline {
    pub games: i64,
    pub cs_per_min: f64,
    pub deaths: f64,
    pub vision_score: f64,
    pub kda: f64,
}

/// One goal this player is already working on, set away from the game.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveChallenge {
    pub id: String,
    pub metric: String,
    pub target_value: f64,
    pub description: String,
}

/// One item, named on the server because the app cannot fetch an icon.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveItem {
    pub id: i64,
    /// Empty when the catalogue did not carry the id. The panel renders that as the id
    /// rather than dropping the item, so a gap in a build stays visible.
    pub name: String,
}

/// How this champion is built on the current patch.
///
/// Shared with the champion browser (`champions.rs`), which shows the same build for a
/// champion being read about rather than one being played. One shape, one panel.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveBuild {
    pub skill_order: Vec<String>,
    pub skill_max_order: Vec<String>,
    pub starters: Vec<LiveItem>,
    pub core: Vec<LiveItem>,
    pub boots: Vec<LiveItem>,
    /// The sample behind the core build. Never rendered without it.
    pub games: i64,
    pub win_rate: f64,
}

/// What the website knows about the game the app is watching.
///
/// Every field that can be absent is an `Option` rather than a default, because the app
/// renders "we do not know this" differently from a number.
///
/// It has to name every field `contract.ts` sends. Serde drops what this struct does not
/// declare, and a field missing here is a panel that can never fill however well the
/// website answers — which is exactly what happened to `baseline`, `challenges` and
/// `build`, added to the contract by three later commits and never mirrored. The test
/// below is what would have caught it.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveContext {
    pub champion: Option<LiveChampion>,
    pub opponent: Option<LiveChampion>,
    pub personal: Option<PersonalMatchup>,
    pub meta: Option<MetaMatchup>,
    pub habits: Vec<Habit>,
    /// Null when this account has not played the champion enough for an average to mean
    /// anything.
    pub baseline: Option<LiveBaseline>,
    pub challenges: Vec<LiveChallenge>,
    /// Null in a mode with no lane to build for, and when the snapshot has no entry.
    pub build: Option<LiveBuild>,
    /// False means the panels are empty for a reason the player can act on.
    pub riot_account_linked: bool,
}

impl ApiClient {
    /// Ask the website what it knows about the game on this screen.
    ///
    /// This is why the device token lives in Rust at all. The reading is personal — it is
    /// the player's own match history — so the request has to be authenticated, and the
    /// credential that authenticates it must not exist in a webview (ADR-038).
    ///
    /// `Ok(None)` means this machine is no longer paired, which is the same state the
    /// pairing screen exists for: either there is no token here, or the website has stopped
    /// accepting the one there is.
    pub async fn live_context(
        &self,
        request: &LiveContextRequest,
    ) -> AppResult<Option<LiveContext>> {
        let Some(token) = crate::secrets::read()? else {
            return Ok(None);
        };

        let response = self
            .http
            .post(format!("{}/api/desktop/live-context", base_url()))
            .bearer_auth(&token)
            .json(request)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        // Revoked while a game was running. Forgetting the token locally is the honest
        // response, and the app finds itself back on the pairing screen rather than
        // retrying a credential the server has disowned for the rest of the match.
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

    /// The hand-written half of ADR-038 K6 for phase 4. `contract.ts` names these fields in
    /// camelCase; serde is told to rename, and this is what would catch it being told to
    /// stop — or a field being renamed on one side only.
    #[test]
    fn the_request_matches_the_contract() {
        let json = serde_json::to_value(LiveContextRequest {
            champion_name: "Ahri".into(),
            opponent_champion_name: Some("Zed".into()),
            position: Some("MIDDLE".into()),
            game_mode: "CLASSIC".into(),
        })
        .unwrap();

        assert_eq!(json["championName"], "Ahri");
        assert_eq!(json["opponentChampionName"], "Zed");
        assert_eq!(json["position"], "MIDDLE");
        assert_eq!(json["gameMode"], "CLASSIC");
        // Nothing else. The website validates this body strictly, and a stray field is a
        // 422 in the middle of a game.
        assert_eq!(json.as_object().unwrap().len(), 4);
    }

    /// ARAM, and every game the client has not resolved a lane for. The website's schema
    /// takes null here; sending nothing at all would be a different shape.
    #[test]
    fn a_game_with_no_lane_still_sends_the_keys_as_null() {
        let json = serde_json::to_value(LiveContextRequest {
            champion_name: "Ahri".into(),
            opponent_champion_name: None,
            position: None,
            game_mode: "ARAM".into(),
        })
        .unwrap();

        assert!(json["opponentChampionName"].is_null());
        assert!(json["position"].is_null());
    }

    fn full_response() -> serde_json::Value {
        serde_json::json!({
            "champion": { "key": "Ahri", "name": "Ahri" },
            "opponent": { "key": "Zed", "name": "Zed" },
            "personal": {
                "games": 7,
                "wins": 3,
                "winRate": 43,
                "avgKda": 2.33,
                "trend": "declining"
            },
            "meta": {
                "position": "MIDDLE",
                "patch": "26.16",
                "winRate": 47.5,
                "games": 4210,
                "verdict": "unfavored",
                "hints": ["Zed's all-in comes online at 6."]
            },
            "habits": [{
                "habitType": "early_deaths",
                "displayName": "Dying before ten minutes",
                "severity": "high",
                "message": "You have died before 10:00 in 6 of your last 10 games."
            }],
            "baseline": {
                "games": 42,
                "csPerMin": 7.1,
                "deaths": 5.2,
                "visionScore": 21.4,
                "kda": 2.8
            },
            "challenges": [{
                "id": "challenge-1",
                "metric": "cs_per_min",
                "targetValue": 7.5,
                "description": "Finish five games above 7.5 CS a minute."
            }],
            "build": {
                "skillOrder": ["Q", "W", "E"],
                "skillMaxOrder": ["Q", "W", "E"],
                "starters": [{ "id": 1056, "name": "Doran's Ring" }],
                "core": [{ "id": 3089, "name": "Rabadon's Deathcap" }],
                "boots": [{ "id": 3020, "name": "Sorcerer's Shoes" }],
                "games": 41000,
                "winRate": 52.5
            },
            "riotAccountLinked": true
        })
    }

    #[test]
    fn a_full_answer_parses() {
        let parsed: LiveContext = serde_json::from_value(full_response()).unwrap();

        assert_eq!(parsed.champion.unwrap().name, "Ahri");
        assert_eq!(parsed.personal.unwrap().trend, "declining");
        let meta = parsed.meta.unwrap();
        assert_eq!(meta.win_rate, 47.5);
        assert_eq!(meta.hints.len(), 1);
        assert_eq!(parsed.habits[0].habit_type, "early_deaths");
        assert_eq!(parsed.baseline.unwrap().cs_per_min, 7.1);
        assert_eq!(parsed.challenges[0].metric, "cs_per_min");
        assert_eq!(parsed.build.unwrap().core[0].name, "Rabadon's Deathcap");
        assert!(parsed.riot_account_linked);
    }

    /// The test that was missing. Serde drops what the struct does not declare, so a field
    /// added to `contract.ts` and not mirrored here vanishes on its way to the webview and
    /// the panel that reads it can never fill — silently, with the website answering
    /// correctly the whole time. `baseline`, `challenges` and `build` were each lost that
    /// way. Round-tripping is what catches the next one.
    #[test]
    fn every_field_the_contract_sends_survives_the_trip_to_the_webview() {
        let sent = full_response();
        let parsed: LiveContext = serde_json::from_value(sent.clone()).unwrap();
        let forwarded = serde_json::to_value(&parsed).unwrap();

        // Keys, not values: `43` arrives back as `43.0` because the field is a rate, and
        // that is the struct doing its job. A key that is absent, or present as null when
        // something was sent, is the struct dropping a panel's data on the floor.
        for (key, value) in sent.as_object().unwrap() {
            let forwarded = forwarded.get(key);
            assert!(forwarded.is_some(), "`{key}` is missing from the struct");
            assert_eq!(
                forwarded.unwrap().is_null(),
                value.is_null(),
                "`{key}` did not survive the trip"
            );
        }
    }

    /// A whole percentage on the wire is still a rate. Deserialising it as an integer would
    /// make `winRate: 43` parse and `winRate: 43.5` fail, in a payload the app cannot fix.
    #[test]
    fn a_whole_number_win_rate_parses_as_a_rate() {
        let parsed: LiveContext = serde_json::from_value(full_response()).unwrap();
        assert_eq!(parsed.personal.unwrap().win_rate, 43.0);
    }

    /// The state a player is in before they have linked a Riot account, and the state every
    /// ARAM game is in. Both are answers, not errors.
    #[test]
    fn an_answer_with_nothing_known_parses() {
        let parsed: LiveContext = serde_json::from_value(serde_json::json!({
            "champion": { "key": "Ahri", "name": "Ahri" },
            "opponent": null,
            "personal": null,
            "meta": null,
            "habits": [],
            "baseline": null,
            "challenges": [],
            "build": null,
            "riotAccountLinked": false
        }))
        .unwrap();

        assert!(parsed.opponent.is_none());
        assert!(parsed.personal.is_none());
        assert!(parsed.meta.is_none());
        assert!(parsed.habits.is_empty());
        assert!(parsed.baseline.is_none());
        assert!(parsed.challenges.is_empty());
        assert!(parsed.build.is_none());
        assert!(!parsed.riot_account_linked);
    }

    /// The reason `trend`, `verdict` and `severity` are strings. A website that starts
    /// answering "volatile" must not blank this player's panel for the rest of the game.
    #[test]
    fn a_trend_this_build_has_never_heard_of_still_parses() {
        let mut json = full_response();
        json["personal"]["trend"] = serde_json::json!("volatile");

        let parsed: LiveContext = serde_json::from_value(json).unwrap();
        assert_eq!(parsed.personal.unwrap().trend, "volatile");
    }

    /// What crosses the IPC boundary on the way back. The token authenticated the request
    /// and stays on this side of it.
    #[test]
    fn the_returned_shape_has_no_token_field() {
        let parsed: LiveContext = serde_json::from_value(full_response()).unwrap();
        let json = serde_json::to_string(&parsed).unwrap();

        assert!(!json.contains("token"));
    }
}
