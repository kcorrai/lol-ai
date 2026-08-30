use serde::{Deserialize, Serialize};

/// One champion's kit, from the webview's side of the IPC boundary.
///
/// Mirrors `src/domains/desktop/abilitiesContract.ts` by hand, like the rest of ADR-038 K6.
/// Its own module rather than a struct inside `champions.rs`, for the same reason the
/// TypeScript is its own file: two contracts carry it. The champion browser sends the kit of
/// whatever is open, and the live and pregame screens send the kit of the lane opponent.
///
/// Nothing here is personal and nothing here is ours — the names, the prose and the burn
/// strings are Data Dragon's, resolved on the website because the catalogue is a JSON feed
/// this app's content policy does not admit and has no reason to.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Ability {
    /// "P", "Q", "W", "E" or "R". A string rather than an enum, like `trend` and `verdict`
    /// next door: a slot this build has not heard of must cost a row, never the payload.
    pub slot: String,
    pub name: String,
    pub description: String,
    pub icon_url: String,
    /// Riot's own published preview clip, addressed by the numeric champion id. Built on
    /// the website because that id is the one identifier this contract does not carry.
    pub video_url: String,
    /// Riot's per-rank burn strings ("14/13/12/11/10"), or null where the value would be a
    /// wrong fact — a passive has no cooldown and a self-cast has no range.
    pub cooldown: Option<String>,
    pub cost: Option<String>,
    pub range: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ability() -> serde_json::Value {
        serde_json::json!({
            "slot": "E",
            "name": "Charm",
            "description": "Ahri blows a kiss that damages and charms an enemy it hits.",
            "iconUrl": "https://ddragon.leagueoflegends.com/cdn/15.14.1/img/spell/AhriSeduce.png",
            "videoUrl": "https://d28xe8vt774jo5.cloudfront.net/champion-abilities/0103/ability_0103_E1.webm",
            "cooldown": "14/13/12/11/10",
            "cost": "50",
            "range": "975"
        })
    }

    /// The hand-written half of ADR-038 K6 for the kit. `abilitiesContract.ts` names these
    /// in camelCase and serde is told to rename; this is what catches either side drifting.
    #[test]
    fn an_ability_parses() {
        let parsed: Ability = serde_json::from_value(ability()).unwrap();

        assert_eq!(parsed.slot, "E");
        assert_eq!(parsed.name, "Charm");
        assert_eq!(parsed.cooldown.as_deref(), Some("14/13/12/11/10"));
        assert!(parsed.video_url.ends_with("ability_0103_E1.webm"));
    }

    /// A passive carries none of the three burn strings, and null is how the website says
    /// so. Deserialising them as plain strings would fail the whole kit on every champion.
    #[test]
    fn a_passive_with_no_burn_strings_parses() {
        let mut json = ability();
        json["slot"] = serde_json::json!("P");
        json["cooldown"] = serde_json::Value::Null;
        json["cost"] = serde_json::Value::Null;
        json["range"] = serde_json::Value::Null;

        let parsed: Ability = serde_json::from_value(json).unwrap();

        assert_eq!(parsed.slot, "P");
        assert!(parsed.cooldown.is_none());
        assert!(parsed.range.is_none());
    }
}
