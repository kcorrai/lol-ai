use serde::{Deserialize, Serialize};

use crate::api::{base_url, read, ApiClient};
use crate::error::{AppError, AppResult};

/// The champion browser's half of the website contract (LA-75, ADR-042).
///
/// Mirrors `src/domains/desktop/championsContract.ts` by hand, like the rest of ADR-038 K6.
/// The tests at the bottom are what keep the mirror honest.
///
/// Nothing here is personal — it is the same patch reading the website's own tier list and
/// counter pages show. It still goes through the core rather than out of the webview,
/// because it goes to an endpoint that wants the device token, and the token is not allowed
/// to exist in a browser context.

/// One champion's line in a lane's list.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampionEntry {
    /// The Data Dragon id — "MonkeyKing" — which is what the detail endpoint keys on.
    pub champion_key: String,
    pub name: String,
    /// 1 (best) .. 5. Zero means the snapshot gave none.
    pub tier: i64,
    pub rank: i64,
    pub win_rate: f64,
    pub pick_rate: f64,
    pub ban_rate: f64,
    pub games: i64,
    pub low_confidence: bool,
}

/// One lane, best first.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampionList {
    pub position: String,
    pub patch: String,
    pub entries: Vec<ChampionEntry>,
}

/// One matchup, always from the subject champion's side.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampionCounter {
    pub champion_key: String,
    pub name: String,
    pub games: i64,
    /// The subject's rate into this opponent, in both lists, so one number does not change
    /// meaning between two columns on the same screen.
    pub subject_win_rate: f64,
}

/// The subject champion's own record in the lane being shown.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampionStats {
    pub games: i64,
    pub win_rate: f64,
    pub pick_rate: f64,
    pub ban_rate: f64,
    pub tier: i64,
}

/// A champion both sides agree on — resolved against Data Dragon by the website.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampionName {
    pub key: String,
    pub name: String,
}

/// One champion in one lane.
///
/// `build` is the same `LiveBuild` the live dashboard carries, deliberately: the app has
/// one build panel, and this is the shape it renders.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampionDetail {
    pub champion: ChampionName,
    /// The lane the website resolved, which is not always the one asked for.
    pub position: String,
    pub patch: String,
    pub available_positions: Vec<String>,
    pub stats: ChampionStats,
    pub build: Option<crate::live_context::LiveBuild>,
    /// The champion's epithet — "The Nine-Tailed Fox". Null when the website could not read
    /// the Data Dragon catalogue, which costs a line and not the champion.
    #[serde(default)]
    pub title: Option<String>,
    /// Riot's own classes: ["Mage", "Assassin"].
    #[serde(default)]
    pub tags: Vec<String>,
    /// Passive first, then Q/W/E/R. `default` for the reason `opponent_abilities` gives:
    /// this app ships separately from the website, and an absent array must cost one panel
    /// rather than the whole champion.
    #[serde(default)]
    pub abilities: Vec<crate::abilities::Ability>,
    /// Opponents that beat this champion, hardest first.
    pub countered_by: Vec<ChampionCounter>,
    /// Opponents this champion beats, most favourable first.
    pub good_into: Vec<ChampionCounter>,
}

/// The address for either champion read: the list when `key` is `None`, one champion when
/// it is not.
///
/// Built through `Url` rather than by formatting a string. The key comes from the webview,
/// and formatted into a path that already carries `?role=` it could add path segments or
/// parameters of its own. `path_segments_mut` escapes it into exactly one segment, so the
/// address this sends is always the one this function describes.
fn champions_url(key: Option<&str>, position: &str) -> AppResult<reqwest::Url> {
    let mut url = reqwest::Url::parse(base_url()).map_err(|e| AppError::Network(e.to_string()))?;

    {
        let mut path = url
            .path_segments_mut()
            .map_err(|_| AppError::Network("the configured address takes no path".into()))?;
        path.extend(["api", "desktop", "champions"]);
        if let Some(key) = key {
            path.push(key);
        }
    }

    url.query_pairs_mut().append_pair("role", position);
    Ok(url)
}

impl ApiClient {
    /// One lane's champions.
    ///
    /// `Ok(None)` means this machine is no longer paired — the same state the pairing
    /// screen exists for, and the same answer `live_context` gives.
    pub async fn champions(&self, position: &str) -> AppResult<Option<ChampionList>> {
        self.get_champions(champions_url(None, position)?).await
    }

    /// One champion in one lane.
    pub async fn champion(&self, key: &str, position: &str) -> AppResult<Option<ChampionDetail>> {
        self.get_champions(champions_url(Some(key), position)?).await
    }

    /// The half both champion reads share: the token, and what a 401 means.
    async fn get_champions<T: serde::de::DeserializeOwned>(
        &self,
        url: reqwest::Url,
    ) -> AppResult<Option<T>> {
        let Some(token) = crate::secrets::read()? else {
            return Ok(None);
        };

        let response = self
            .http
            .get(url)
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        // Revoked while the player was reading. Forgetting the token locally is the honest
        // response: keeping a credential the server has disowned would leave the app
        // claiming to be paired for ever.
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

    fn list_response() -> serde_json::Value {
        serde_json::json!({
            "position": "MIDDLE",
            "patch": "26.16",
            "entries": [{
                "championKey": "Ahri",
                "name": "Ahri",
                "tier": 1,
                "rank": 3,
                "winRate": 51.2,
                "pickRate": 8.4,
                "banRate": 3.1,
                "games": 91204,
                "lowConfidence": false
            }]
        })
    }

    fn detail_response() -> serde_json::Value {
        serde_json::json!({
            "champion": { "key": "Ahri", "name": "Ahri" },
            "position": "MIDDLE",
            "patch": "26.16",
            "availablePositions": ["MIDDLE"],
            "stats": {
                "games": 91204,
                "winRate": 51.2,
                "pickRate": 8.4,
                "banRate": 3.1,
                "tier": 1
            },
            "build": {
                "skillOrder": ["Q", "W", "E"],
                "skillMaxOrder": ["Q", "W", "E"],
                "starters": [{ "id": 1055, "name": "Doran's Ring" }],
                "core": [{ "id": 3089, "name": "Rabadon's Deathcap" }],
                "boots": [{ "id": 3020, "name": "Sorcerer's Shoes" }],
                "games": 41000,
                "winRate": 52.5
            },
            "title": "the Nine-Tailed Fox",
            "tags": ["Mage", "Assassin"],
            "abilities": [{
                "slot": "P",
                "name": "Essence Theft",
                "description": "Ahri gains a stack for each enemy hit.",
                "iconUrl": "https://ddragon.leagueoflegends.com/cdn/15.14.1/img/passive/Ahri_SoulEaten.png",
                "videoUrl": "https://d28xe8vt774jo5.cloudfront.net/champion-abilities/0103/ability_0103_P1.webm",
                "cooldown": null,
                "cost": null,
                "range": null
            }],
            "counteredBy": [{
                "championKey": "Zed",
                "name": "Zed",
                "games": 4210,
                "subjectWinRate": 47.5
            }],
            "goodInto": [{
                "championKey": "Lux",
                "name": "Lux",
                "games": 3100,
                "subjectWinRate": 53.8
            }]
        })
    }

    /// The hand-written half of ADR-038 K6 for the champion browser. `championsContract.ts`
    /// names these fields in camelCase; serde is told to rename, and this is what would
    /// catch it being told to stop — or a field being renamed on one side only.
    #[test]
    fn a_lane_list_parses() {
        let parsed: ChampionList = serde_json::from_value(list_response()).unwrap();

        assert_eq!(parsed.position, "MIDDLE");
        assert_eq!(parsed.patch, "26.16");
        assert_eq!(parsed.entries[0].champion_key, "Ahri");
        assert_eq!(parsed.entries[0].games, 91204);
        assert!(!parsed.entries[0].low_confidence);
    }

    /// An empty lane is an answer, not a failure. A snapshot the website could not reach at
    /// all is a 503, which arrives as an error rather than as this.
    #[test]
    fn a_lane_with_no_champions_parses() {
        let parsed: ChampionList = serde_json::from_value(serde_json::json!({
            "position": "UTILITY",
            "patch": "26.16",
            "entries": []
        }))
        .unwrap();

        assert!(parsed.entries.is_empty());
    }

    #[test]
    fn a_full_champion_parses() {
        let parsed: ChampionDetail = serde_json::from_value(detail_response()).unwrap();

        assert_eq!(parsed.champion.key, "Ahri");
        assert_eq!(parsed.available_positions, vec!["MIDDLE"]);
        assert_eq!(parsed.stats.win_rate, 51.2);
        assert_eq!(parsed.countered_by[0].name, "Zed");
        assert_eq!(parsed.good_into[0].subject_win_rate, 53.8);

        let build = parsed.build.unwrap();
        assert_eq!(build.core[0].name, "Rabadon's Deathcap");
        assert_eq!(build.skill_max_order, vec!["Q", "W", "E"]);
    }

    /// The kit, which arrives from the Data Dragon catalogue rather than the patch snapshot.
    /// It is a separate feed, so it is a separate thing that can be missing.
    #[test]
    fn a_champions_kit_parses() {
        let parsed: ChampionDetail = serde_json::from_value(detail_response()).unwrap();

        assert_eq!(parsed.title.as_deref(), Some("the Nine-Tailed Fox"));
        assert_eq!(parsed.tags, vec!["Mage", "Assassin"]);
        assert_eq!(parsed.abilities[0].slot, "P");
        assert!(parsed.abilities[0].cooldown.is_none());
    }

    /// A website older than this build sends no kit at all. That has to cost the abilities
    /// panel, not the champion — without the defaults it would fail the whole payload and
    /// the screen would show nothing at all for a champion it has every number for.
    #[test]
    fn a_champion_from_a_website_with_no_kit_still_parses() {
        let mut json = detail_response();
        let object = json.as_object_mut().unwrap();
        object.remove("title");
        object.remove("tags");
        object.remove("abilities");

        let parsed: ChampionDetail = serde_json::from_value(json).unwrap();

        assert!(parsed.title.is_none());
        assert!(parsed.tags.is_empty());
        assert!(parsed.abilities.is_empty());
        assert_eq!(parsed.stats.win_rate, 51.2);
    }

    /// A champion the patch snapshot carries no build for. Null is a state the panel renders
    /// differently from an empty build, so it has to survive the wire.
    #[test]
    fn a_champion_with_no_build_parses() {
        let mut json = detail_response();
        json["build"] = serde_json::Value::Null;

        let parsed: ChampionDetail = serde_json::from_value(json).unwrap();
        assert!(parsed.build.is_none());
    }

    /// A whole percentage on the wire is still a rate. Deserialising it as an integer would
    /// make `winRate: 51` parse and `winRate: 51.2` fail, in a payload the app cannot fix.
    #[test]
    fn a_whole_number_win_rate_parses_as_a_rate() {
        let mut json = list_response();
        json["entries"][0]["winRate"] = serde_json::json!(51);

        let parsed: ChampionList = serde_json::from_value(json).unwrap();
        assert_eq!(parsed.entries[0].win_rate, 51.0);
    }

    #[test]
    fn the_list_address_carries_the_lane_and_no_champion() {
        let url = champions_url(None, "MIDDLE").unwrap();

        assert_eq!(url.path(), "/api/desktop/champions");
        assert_eq!(url.query(), Some("role=MIDDLE"));
    }

    /// The ordinary case. Data Dragon ids are letters only — the punctuation people expect
    /// lives in the display name, so "Nunu & Willump" is `Nunu` and "Dr. Mundo" is
    /// `DrMundo`.
    #[test]
    fn a_champion_address_carries_the_id_and_the_lane() {
        let url = champions_url(Some("MonkeyKing"), "TOP").unwrap();

        assert_eq!(url.path(), "/api/desktop/champions/MonkeyKing");
        assert_eq!(url.query(), Some("role=TOP"));
    }

    /// The key arrives from the webview, so it is treated as something that might try to be
    /// more than a name. `path_segments_mut` escapes it into one segment; formatting it into
    /// the address by hand would let it add segments and parameters of its own.
    #[test]
    fn a_champion_key_cannot_add_segments_or_parameters_of_its_own() {
        let url = champions_url(Some("a/b?role=BOTTOM"), "TOP").unwrap();

        assert_eq!(url.path_segments().unwrap().count(), 4);
        assert_eq!(url.query(), Some("role=TOP"));
    }

    /// What crosses the IPC boundary on the way back. The token authenticated the request
    /// and stays on this side of it.
    #[test]
    fn the_returned_shape_has_no_token_field() {
        let parsed: ChampionDetail = serde_json::from_value(detail_response()).unwrap();
        let json = serde_json::to_string(&parsed).unwrap();

        assert!(!json.contains("token"));
    }
}
