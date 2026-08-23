use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

/// The client that talks to LoL AI Coach itself, as opposed to the game.
///
/// Deliberately a second client rather than a second use of `LiveClient`. That one trusts
/// Riot's certificate authority and refuses every public one, which is exactly right for
/// port 2999 and exactly wrong here: this connection goes over the public internet to our
/// own service, and it should be verified against the machine's ordinary root store like
/// any other HTTPS request.
///
/// It also carries the device token, which is why the pairing exchange lives in Rust at
/// all. The token is written straight to the OS credential store and read back into an
/// Authorization header; it never crosses the IPC boundary into the webview (ADR-038).
///
/// The address is fixed at compile time. A runtime setting for it would mean anyone who
/// could write to a config file could point this client — and the token it carries — at a
/// host of their choosing.
const RELEASE_BASE: &str = "https://lolaicoach.gg";
/// The port the website's own `npm run dev` serves on — `next dev --turbo -p 3001` in the
/// repository root's package.json. Not 3000: that is Next's default, and this project moved
/// off it. A debug build pointing at the default reaches nothing, which is what it did
/// until LA-67 and why nothing in the app had ever talked to the website through the core.
const DEV_BASE: &str = "http://localhost:3001";

pub fn base_url() -> &'static str {
    match option_env!("LOLAI_API_BASE") {
        Some(url) => url,
        None if cfg!(debug_assertions) => DEV_BASE,
        None => RELEASE_BASE,
    }
}

/// Mirrors `src/domains/desktop/contract.ts` by hand (ADR-038, K6). The test at the bottom
/// of this file is what keeps the mirror honest: it asserts the field names these structs
/// actually serialise to, so a rename on either side has to be answered here.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PairRequest<'a> {
    code: &'a str,
    label: &'a str,
    platform: &'a str,
    app_version: Option<&'a str>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RiotAccount {
    pub id: String,
    pub game_name: String,
    pub tag_line: String,
    pub region: String,
    pub summoner_level: i64,
    pub profile_icon_id: i64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub user_id: String,
    pub email: Option<String>,
    pub name: Option<String>,
    /// Null when the player has linked no Riot account. A real state the UI has to say out
    /// loud rather than showing an empty dashboard.
    pub riot_account: Option<RiotAccount>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub id: String,
    pub label: String,
    pub platform: String,
    pub app_version: Option<String>,
    pub created_at: String,
    pub last_seen_at: Option<String>,
    pub revoked_at: Option<String>,
}

/// What the app knows about itself once paired. Note what is missing: the token.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Pairing {
    pub device: Device,
    pub account: Account,
}

#[derive(Deserialize)]
struct PairResponse {
    token: String,
    device: Device,
    account: Account,
}

#[derive(Deserialize)]
struct Envelope<T> {
    data: Option<T>,
    error: Option<ErrorBody>,
}

#[derive(Deserialize)]
struct ErrorBody {
    message: String,
}

pub struct ApiClient {
    // `pub(crate)` so `live_context` can hang its own request off the same client. One
    // client, one connection pool, one place the timeout and user agent are decided.
    pub(crate) http: reqwest::Client,
}

impl ApiClient {
    pub fn new() -> AppResult<Self> {
        let http = reqwest::Client::builder()
            // Longer than the game client's two seconds: this one crosses the internet, and
            // a player on a slow connection typing a code that expires in ten minutes would
            // rather wait than be told the code was wrong.
            .timeout(Duration::from_secs(20))
            .user_agent(concat!("LoLAICoachDesktop/", env!("CARGO_PKG_VERSION")))
            .build()
            .map_err(|e| AppError::Network(e.to_string()))?;

        Ok(Self { http })
    }

    /// Exchange a pairing code for a device token.
    ///
    /// The token goes to the credential store here and is not returned. The caller gets the
    /// account it belongs to, which is everything the UI needs and nothing it should hold.
    pub async fn pair(&self, code: &str, label: &str, platform: &str) -> AppResult<Pairing> {
        let body = PairRequest {
            code,
            label,
            platform,
            app_version: Some(env!("CARGO_PKG_VERSION")),
        };

        let response = self
            .http
            .post(format!("{}/api/desktop/pair", base_url()))
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        let paired: PairResponse = read(response).await?;

        crate::secrets::store(&paired.token)?;

        Ok(Pairing {
            device: paired.device,
            account: paired.account,
        })
    }

    /// Who this machine is acting as, using the token already in the credential store.
    ///
    /// `Ok(None)` covers both "no token here" and "the website no longer accepts it" —
    /// which from the player's side are the same state, and both mean the pairing screen.
    pub async fn me(&self) -> AppResult<Option<Pairing>> {
        let Some(token) = crate::secrets::read()? else {
            return Ok(None);
        };

        let response = self
            .http
            .get(format!("{}/api/desktop/me", base_url()))
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        // Revoked on the website, or the account is gone. Forgetting the token locally is
        // the honest response: keeping a credential the server has disowned would leave the
        // app claiming to be paired for ever.
        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            crate::secrets::clear()?;
            return Ok(None);
        }

        read(response).await.map(Some)
    }
}

/// Unwraps the website's `{ data, error }` envelope.
///
/// The server's own message is passed through: those strings are written for the player
/// ("that pairing code is not valid", "revoke one in Settings") and are the only thing that
/// tells them what to do next. Nothing in this path carries the token.
pub(crate) async fn read<T: serde::de::DeserializeOwned>(
    response: reqwest::Response,
) -> AppResult<T> {
    let status = response.status();
    // AppError::Malformed and AppError::Status both name the League client in their text,
    // which is true where they are raised and would be a lie here.
    let envelope: Envelope<T> = response
        .json()
        .await
        .map_err(|_| AppError::Api("LoL AI Coach sent an answer this version could not read".into()))?;

    if let Some(data) = envelope.data {
        return Ok(data);
    }

    Err(match envelope.error {
        Some(body) => AppError::Api(body.message),
        None => AppError::Api(format!("LoL AI Coach answered with status {}", status.as_u16())),
    })
}

/// The three platforms the contract allows. Anything else is refused here rather than sent
/// and rejected, so the message names the actual problem.
pub fn platform() -> AppResult<&'static str> {
    match std::env::consts::OS {
        "windows" => Ok("windows"),
        "macos" => Ok("macos"),
        "linux" => Ok("linux"),
        other => Err(AppError::Api(format!(
            "the desktop companion does not run on {other}"
        ))),
    }
}

/// What the player will see in their device list.
///
/// Read from the environment rather than through a crate, because a hostname is the only
/// thing wanted from one and every candidate pulls in more than that. An empty answer is
/// treated as no answer: `COMPUTERNAME=` is not a name anyone would recognise in a list.
pub fn machine_label() -> String {
    for key in ["COMPUTERNAME", "HOSTNAME"] {
        if let Ok(name) = std::env::var(key) {
            let name = name.trim();
            if !name.is_empty() {
                return name.to_string();
            }
        }
    }

    std::fs::read_to_string("/etc/hostname")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "Unknown machine".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_client_builds() {
        assert!(ApiClient::new().is_ok());
    }

    /// The address is compiled in. A build that shipped pointing at localhost would leave
    /// every installed copy unable to pair, and one pointing anywhere unexpected would send
    /// device tokens there.
    /// The number here has to match the one the website is actually served on. It did not,
    /// for three phases, and no test would have caught it — so this is that test.
    #[test]
    fn the_debug_base_points_at_the_port_the_website_uses() {
        assert_eq!(DEV_BASE, "http://localhost:3001");
    }

    #[test]
    fn the_base_url_is_https_unless_this_is_a_debug_build() {
        let url = base_url();
        if option_env!("LOLAI_API_BASE").is_none() && !cfg!(debug_assertions) {
            assert_eq!(url, RELEASE_BASE);
            assert!(url.starts_with("https://"));
        }
    }

    /// The hand-written half of ADR-038 K6. `contract.ts` names these fields in camelCase;
    /// serde is told to rename, and this is what would catch it being told to stop.
    #[test]
    fn the_pair_request_matches_the_contract() {
        let body = PairRequest {
            code: "ABCDEFGH",
            label: "KAAN-PC",
            platform: "windows",
            app_version: Some("0.1.0"),
        };
        let json = serde_json::to_value(&body).unwrap();

        assert_eq!(json["code"], "ABCDEFGH");
        assert_eq!(json["label"], "KAAN-PC");
        assert_eq!(json["platform"], "windows");
        assert_eq!(json["appVersion"], "0.1.0");
    }

    #[test]
    fn the_pairing_response_matches_the_contract() {
        let json = serde_json::json!({
            "token": "t".repeat(43),
            "device": {
                "id": "device-1",
                "label": "KAAN-PC",
                "platform": "windows",
                "appVersion": "0.1.0",
                "createdAt": "2026-08-23T12:00:00.000Z",
                "lastSeenAt": null,
                "revokedAt": null
            },
            "account": {
                "userId": "user-1",
                "email": "k@example.com",
                "name": "Kaan",
                "riotAccount": {
                    "id": "riot-1",
                    "gameName": "kaanproak0",
                    "tagLine": "TR1",
                    "region": "tr1",
                    "summonerLevel": 300,
                    "profileIconId": 12
                }
            }
        });

        let parsed: PairResponse = serde_json::from_value(json).unwrap();

        assert_eq!(parsed.device.label, "KAAN-PC");
        assert_eq!(parsed.account.user_id, "user-1");
        assert_eq!(parsed.account.riot_account.unwrap().game_name, "kaanproak0");
    }

    /// Null is a state, not an omission: an account with no Riot account linked pairs fine
    /// and the app has to say so.
    #[test]
    fn an_account_with_no_riot_account_parses() {
        let parsed: Account = serde_json::from_value(serde_json::json!({
            "userId": "user-1",
            "email": null,
            "name": null,
            "riotAccount": null
        }))
        .unwrap();

        assert!(parsed.riot_account.is_none());
    }

    /// The token is what the app is not allowed to hand upwards. `Pairing` is the shape the
    /// command returns, and it has nowhere to put one.
    #[test]
    fn the_returned_shape_has_no_token_field() {
        let pairing = Pairing {
            device: Device {
                id: "device-1".into(),
                label: "KAAN-PC".into(),
                platform: "windows".into(),
                app_version: None,
                created_at: "2026-08-23T12:00:00.000Z".into(),
                last_seen_at: None,
                revoked_at: None,
            },
            account: Account {
                user_id: "user-1".into(),
                email: None,
                name: None,
                riot_account: None,
            },
        };

        let json = serde_json::to_string(&pairing).unwrap();

        assert!(!json.contains("token"));
    }

    #[test]
    fn the_platform_is_one_the_contract_allows() {
        let platform = platform().expect("this test only runs on a supported platform");
        assert!(["windows", "macos", "linux"].contains(&platform));
    }

    #[test]
    fn the_machine_label_is_never_empty() {
        assert!(!machine_label().is_empty());
    }
}
