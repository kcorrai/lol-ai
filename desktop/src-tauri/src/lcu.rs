use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

/// The League Client Update API — champion select, and the rune pages it can write.
///
/// **This ships switched off.** Riot's own documentation says the League Client API "is
/// not officially supported for use with third party applications", and their January 2019
/// policy attaches three conditions to it: pre-release approval for every release *and*
/// every update, an approved-endpoint allowlist, and a ban on applications using it for
/// players in Korea. ADR-038 therefore puts it behind a capability that is compiled out by
/// default.
///
/// Turning it on before that approval exists risks the Riot API key for the *whole*
/// product — the website included — and breaks the app outright in Korea. It is a release
/// decision, not a build one, which is why it is a Cargo feature and not a setting.
///
/// What is here is deliberately the smallest thing that could be useful: read champion
/// select, and write one rune page. No automation of any kind — no auto-accept, no
/// auto-pick, no auto-ban. Those are input taken on the player's behalf, which is Riot's
/// definition of scripting and is absent from this product rather than deferred.
pub const ENABLED: bool = cfg!(feature = "lcu");

/// The gate, in one place so both calls cannot drift apart.
///
/// Extracted rather than inlined so it can be asserted without a runtime: the property
/// worth a test is that a default build refuses, and that should not depend on anyone
/// remembering to spin up an executor.
fn guard() -> AppResult<()> {
    if ENABLED {
        Ok(())
    } else {
        Err(AppError::LcuDisabled)
    }
}

/// Basic auth username, fixed by the client. The password is the lockfile's.
const USER: &str = "riot";

/// The client answers on the loopback interface with a certificate it generated for
/// itself, and unlike the game's it is not signed by an authority Riot publishes. There is
/// nothing to pin, so this client accepts an invalid certificate — bounded to the loopback
/// address, and to a port that a lockfile only readable by this user named.
const HOST: &str = "127.0.0.1";

/// The only requests this app will make of the client.
///
/// An enum rather than a list of strings the webview passes in. The Live Client reader
/// takes a path and checks it against an allowlist because its callers legitimately need
/// to choose between five documented reads; here the renderer has no path to choose at
/// all, so it is given none. There is no string from the webview anywhere in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Endpoint {
    ChampSelectSession,
    PerkPages,
}

impl Endpoint {
    pub fn path(self) -> &'static str {
        match self {
            Endpoint::ChampSelectSession => "/lol-champ-select/v1/session",
            Endpoint::PerkPages => "/lol-perks/v1/pages",
        }
    }
}

/// What a lockfile says: which port the client is listening on, and the password for it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Lockfile {
    pub port: u16,
    pub password: String,
}

/// Parses the lockfile's five colon-separated fields: name, PID, port, password, protocol.
///
/// Strict about the shape and quiet about the reason. The password is field four, and an
/// error message that quoted the line it failed on would put that password in a log.
pub fn parse_lockfile(contents: &str) -> Option<Lockfile> {
    let line = contents.lines().next()?.trim();
    let mut fields = line.split(':');

    let _name = fields.next()?;
    let _pid = fields.next()?;
    let port = fields.next()?.parse::<u16>().ok()?;
    let password = fields.next()?;
    let protocol = fields.next()?;

    // Anything but https means this is not a lockfile this code understands, and guessing
    // at a scheme is how credentials end up on a plaintext connection.
    if protocol != "https" || password.is_empty() {
        return None;
    }
    // A sixth field means the format changed under us.
    if fields.next().is_some() {
        return None;
    }

    Some(Lockfile {
        port,
        password: password.to_string(),
    })
}

/// Where the client leaves its lockfile, best effort and in order.
///
/// There is no registry key or environment variable that names this reliably, and reading
/// the running process's command line to find the install directory means WMI on Windows
/// for a path that is standard on nearly every machine. So: the documented default
/// installs, then the Riot Client's own configuration directory.
///
/// `LOLAI_LCU_LOCKFILE` overrides all of it. That is for development against a client
/// installed somewhere unusual; it names a path, never a credential.
pub fn candidate_lockfiles() -> Vec<PathBuf> {
    if let Ok(explicit) = std::env::var("LOLAI_LCU_LOCKFILE") {
        if !explicit.trim().is_empty() {
            return vec![PathBuf::from(explicit)];
        }
    }

    let mut paths = Vec::new();

    if cfg!(windows) {
        for root in ["C:\\Riot Games\\League of Legends", "D:\\Riot Games\\League of Legends"] {
            paths.push(Path::new(root).join("lockfile"));
        }
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            paths.push(
                Path::new(&local)
                    .join("Riot Games")
                    .join("Riot Client")
                    .join("Config")
                    .join("lockfile"),
            );
        }
    } else {
        paths.push(PathBuf::from(
            "/Applications/League of Legends.app/Contents/LoL/lockfile",
        ));
    }

    paths
}

/// The first lockfile that exists and parses, or `None` — which is what a client that is
/// not running looks like from here, and is not a fault.
pub fn find_lockfile() -> Option<Lockfile> {
    candidate_lockfiles()
        .into_iter()
        .filter_map(|path| std::fs::read_to_string(path).ok())
        .find_map(|contents| parse_lockfile(&contents))
}

/// One rune page, as the client stores it.
///
/// Mirrors what `getChampionBuild` already returns on the website — this app computes no
/// rune page of its own, it carries one the meta domain worked out.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PerkPage {
    pub name: String,
    pub primary_style_id: u32,
    pub sub_style_id: u32,
    /// The nine perk ids in the order the client expects: six runes, then three shards.
    pub selected_perk_ids: Vec<u32>,
}

pub struct LcuClient {
    http: reqwest::Client,
}

impl LcuClient {
    pub fn new() -> AppResult<Self> {
        let http = reqwest::Client::builder()
            .use_rustls_tls()
            // The client's certificate is self-signed with nothing published to pin it
            // against. Every request this builds goes to 127.0.0.1 on a port named by a
            // lockfile in the user's own profile, so the connection cannot leave the
            // machine — but it is worth being plain that this is weaker than the Live
            // Client reader, which trusts exactly one published authority.
            .danger_accept_invalid_certs(true)
            .timeout(Duration::from_secs(2))
            .build()
            .map_err(|e| AppError::Transport(e.to_string()))?;

        Ok(Self { http })
    }

    fn url(lock: &Lockfile, endpoint: Endpoint) -> String {
        format!("https://{HOST}:{}{}", lock.port, endpoint.path())
    }

    /// `Ok(None)` means the client is not running, or is not in champion select.
    pub async fn get(&self, endpoint: Endpoint) -> AppResult<Option<serde_json::Value>> {
        guard()?;
        let Some(lock) = find_lockfile() else {
            return Ok(None);
        };

        let response = match self
            .http
            .get(Self::url(&lock, endpoint))
            .basic_auth(USER, Some(&lock.password))
            .send()
            .await
        {
            Ok(r) => r,
            // A stale lockfile outlives the client that wrote it, so a refused connection
            // here is the ordinary "League is closed" answer rather than a fault.
            Err(e) if e.is_connect() || e.is_timeout() => return Ok(None),
            Err(e) => return Err(AppError::Transport(e.to_string())),
        };

        // The client serves 404 for the champion select session whenever there is not one.
        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !response.status().is_success() {
            return Err(AppError::Status(response.status().as_u16()));
        }

        response
            .json::<serde_json::Value>()
            .await
            .map(Some)
            .map_err(|e| AppError::Malformed(e.to_string()))
    }

    /// Writes one rune page. `Ok(false)` means the client is not running.
    pub async fn put_perk_page(&self, page: &PerkPage) -> AppResult<bool> {
        guard()?;
        let Some(lock) = find_lockfile() else {
            return Ok(false);
        };

        let response = match self
            .http
            .post(Self::url(&lock, Endpoint::PerkPages))
            .basic_auth(USER, Some(&lock.password))
            .json(page)
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) if e.is_connect() || e.is_timeout() => return Ok(false),
            Err(e) => return Err(AppError::Transport(e.to_string())),
        };

        if !response.status().is_success() {
            return Err(AppError::Status(response.status().as_u16()));
        }
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "LeagueClient:24448:57379:Nz1BcXk3QVhJdFBmZ2Q:https";

    #[test]
    fn parses_a_lockfile() {
        let lock = parse_lockfile(SAMPLE).expect("the documented shape must parse");
        assert_eq!(lock.port, 57379);
        assert_eq!(lock.password, "Nz1BcXk3QVhJdFBmZ2Q");
    }

    #[test]
    fn ignores_a_trailing_newline_the_client_writes() {
        assert_eq!(parse_lockfile(&format!("{SAMPLE}\n")), parse_lockfile(SAMPLE));
    }

    #[test]
    fn refuses_a_lockfile_that_is_not_one() {
        assert!(parse_lockfile("").is_none());
        assert!(parse_lockfile("LeagueClient:24448:57379").is_none());
        // A port that is not a number, which is what a half-written file looks like.
        assert!(parse_lockfile("LeagueClient:24448:soon:pass:https").is_none());
        // An empty password would authenticate as nobody and read as a success.
        assert!(parse_lockfile("LeagueClient:24448:57379::https").is_none());
        // Never downgrade the scheme the credential travels on.
        assert!(parse_lockfile("LeagueClient:24448:57379:pass:http").is_none());
        // A field the format did not have when this was written.
        assert!(parse_lockfile("LeagueClient:24448:57379:pass:https:extra").is_none());
    }

    #[test]
    fn the_endpoints_are_the_two_that_were_approved_for() {
        assert_eq!(
            Endpoint::ChampSelectSession.path(),
            "/lol-champ-select/v1/session"
        );
        assert_eq!(Endpoint::PerkPages.path(), "/lol-perks/v1/pages");
    }

    #[test]
    fn the_url_is_always_loopback() {
        let lock = parse_lockfile(SAMPLE).unwrap();
        let url = LcuClient::url(&lock, Endpoint::ChampSelectSession);
        assert!(url.starts_with("https://127.0.0.1:57379/"));
    }

    /// The guard that matters. If either of these fails, a build is shipping an
    /// unapproved API, which is the thing ADR-038 exists to stop.
    #[test]
    #[cfg(not(feature = "lcu"))]
    fn ships_disabled_and_refuses() {
        assert!(!ENABLED);
        assert!(matches!(guard(), Err(AppError::LcuDisabled)));
    }

    #[test]
    #[cfg(feature = "lcu")]
    fn the_feature_is_what_opens_it() {
        assert!(ENABLED);
        assert!(guard().is_ok());
    }
}
