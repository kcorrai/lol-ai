use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::time::Duration;

use crate::error::{AppError, AppResult};

/// Riot's Live Client Data API, read over a connection that trusts one certificate.
///
/// The game serves this on the loopback interface with a certificate signed by Riot's own
/// authority, which no public root store contains. The usual shortcut is to switch
/// verification off. We do not: any process on this machine can bind port 2999 before the
/// game does, and a client that accepts anything would hand it the same trust it gives
/// League.
///
/// Instead the built-in roots are turned *off* and Riot's certificate is the only one
/// installed, so this client will talk to the game and to nothing else.
///
/// The URL says `localhost` while the connection goes to `127.0.0.1` on purpose. Riot
/// issues the leaf for the name, not the address, so dialling the address literal would
/// fail the hostname check; `resolve` pins where the request actually goes, which keeps
/// full verification instead of waiving it.
const HOST: &str = "localhost";
const PORT: u16 = 2999;

/// Bundled rather than fetched. Riot publishes it at
/// static.developer.riotgames.com/docs/lol/riotgames.pem; it is self-signed and runs to
/// 2043. A companion that had to download its trust anchor before it could read the game
/// would be useless offline and trivial to intercept on first run.
const RIOT_ROOT_CA: &str = include_str!("../riot-root-ca.pem");

/// The only paths this app will request.
///
/// The webview names the path, so without this list a compromised or merely buggy renderer
/// could aim the privileged client at anything the game exposes. Everything the product
/// needs is here; adding to it is a deliberate act.
const ALLOWED_PATHS: &[&str] = &[
    "/liveclientdata/allgamedata",
    "/liveclientdata/activeplayer",
    "/liveclientdata/playerlist",
    "/liveclientdata/eventdata",
    "/liveclientdata/gamestats",
];

pub fn is_allowed(path: &str) -> bool {
    ALLOWED_PATHS.contains(&path)
}

pub struct LiveClient {
    http: reqwest::Client,
}

impl LiveClient {
    pub fn new() -> AppResult<Self> {
        let cert = reqwest::Certificate::from_pem(RIOT_ROOT_CA.as_bytes())
            .map_err(|e| AppError::Transport(format!("Riot's bundled certificate is unusable: {e}")))?;

        let http = reqwest::Client::builder()
            .use_rustls_tls()
            // `tls_certs_only` rather than `tls_certs_merge`: this client trusts Riot's
            // authority and refuses every public one, so nothing but the game can satisfy it.
            .tls_certs_only([cert])
            .resolve(HOST, SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), PORT))
            // The game is on the same machine. If it has not answered in two seconds it is
            // not running, and the UI would rather hear that than wait.
            .timeout(Duration::from_secs(2))
            .build()
            .map_err(|e| AppError::Transport(e.to_string()))?;

        Ok(Self { http })
    }

    /// `Ok(None)` means no game — the ordinary state, not a fault.
    pub async fn get(&self, path: &str) -> AppResult<Option<serde_json::Value>> {
        if !is_allowed(path) {
            return Err(AppError::ForbiddenPath);
        }

        let url = format!("https://{HOST}:{PORT}{path}");
        let response = match self.http.get(&url).send().await {
            Ok(r) => r,
            // Nothing listening on 2999 is what "League is closed" looks like from here.
            Err(e) if e.is_connect() || e.is_timeout() => return Ok(None),
            Err(e) => return Err(AppError::Transport(e.to_string())),
        };

        // The client serves 404 for these paths while sitting in the lobby.
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_bundled_certificate_parses() {
        assert!(reqwest::Certificate::from_pem(RIOT_ROOT_CA.as_bytes()).is_ok());
    }

    #[test]
    fn the_client_builds_with_riots_root_only() {
        assert!(LiveClient::new().is_ok());
    }

    #[test]
    fn allows_the_documented_paths() {
        assert!(is_allowed("/liveclientdata/allgamedata"));
        assert!(is_allowed("/liveclientdata/eventdata"));
    }

    #[test]
    fn refuses_anything_else() {
        // The LCU sits behind an approval this build does not have (ADR-038); the swagger
        // route would happily describe endpoints we are not allowed to call.
        assert!(!is_allowed("/lol-champ-select/v1/session"));
        assert!(!is_allowed("/swagger/v3/openapi.json"));
        assert!(!is_allowed("/liveclientdata/allgamedata/../../etc/passwd"));
        assert!(!is_allowed(""));
    }
}
