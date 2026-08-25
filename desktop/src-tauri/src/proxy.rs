//! One request to the website, on behalf of a screen that is the website's own.
//!
//! ADR-043. ADR-042 gave every desktop page three pieces — a Next route, a
//! `#[tauri::command]`, and Rust structs mirroring the wire contract by hand. The first
//! two pages cost 323 lines of mirror in `champions.rs`; 108 of them would cost a second
//! product. The constraint that made ADR-042 right was never the mirror, though — it was
//! that the device token must not exist in a browser context. This module honours that
//! constraint with one command instead of one per page.
//!
//! The shape is `live_client_get`'s, deliberately: the webview names the path, the client
//! checks it against a fixed list, and what comes back is unparsed JSON. Nothing here
//! knows what a champion or a match is, which is exactly why it does not have to be
//! edited when a field is added to one.

use serde::Serialize;

use crate::api::{base_url, ApiClient};
use crate::error::{AppError, AppResult};

/// What the website answered, near enough verbatim for the bridge to rebuild a `Response`.
///
/// The envelope is *not* unwrapped here, unlike `api::read`. These bodies are read by the
/// website's own hooks, which expect `{ data, error, meta }` and take their error messages
/// out of it. Unwrapping would leave them a shape they do not know.
#[derive(Debug, Serialize)]
pub struct ProxyResponse {
    pub status: u16,
    /// `None` when the answer had no body — a 204, or an error page that was not JSON.
    pub body: Option<serde_json::Value>,
}

/// The methods a screen is allowed to use. Anything else is refused before a request is
/// built, so the set of verbs this app can aim at the website is decided here and not by
/// whatever string a renderer passed in.
const ALLOWED_METHODS: &[&str] = &["GET", "POST", "PATCH", "PUT", "DELETE"];

/// The paths the desktop app may reach.
///
/// **A trailing slash means "and everything under it"; without one the match is exact.**
/// That distinction is load-bearing rather than tidy. `/api/subscription` as a prefix would
/// have swept in `/api/subscription/retention-offer`, and the same shape would sweep in a
/// `/cancel` the day somebody adds one — a billing route reached by a token sitting in a
/// credential store on a machine that may be shared or resold. The test below is what
/// caught exactly that while this list was being written.
///
/// **A `*` stands for exactly one segment** — `/api/riot/*/performance` is the account id in
/// the middle and nothing else. It exists because neither of the other two forms can express
/// a route with an id in it: an exact match cannot, and `/api/riot/` as a prefix would hand
/// over all twenty-one routes under it, `/sync` and `/chat` included — one of which spends
/// Riot quota and the other of which spends money on a model. A wildcard is the narrow way
/// to say what a prefix would say far too loudly.
///
/// This list is the desktop half of a pair. The other half is `deviceAccess: true` on the
/// route itself, and a path here that the route has not opted into answers 401. Both have
/// to say yes, and adding to either is a deliberate act.
///
/// Nothing that changes a credential is here, and nothing may be added: sessions, the
/// second factor, password changes and billing are all reachable only from a browser the
/// player is sitting in front of. A device token is a capability left on a machine, and
/// ADR-038's rule is that it must never do what a stolen one should not.
const ALLOWED_PATHS: &[&str] = &[
    // Pairing and liveness — this app's own namespace, and the only prefix here that is
    // meant to be open-ended (ADR-038).
    "/api/desktop/",
    // The three screens ADR-043 proves itself on: the dashboard, the match archive and the
    // achievement wall. Read off those pages rather than guessed at — every `/api/` string
    // reachable from their imports — and it stops where their reads stop.
    "/api/achievements",
    "/api/achievements/seen",
    "/api/challenges",
    "/api/daily-quest",
    "/api/duo",
    "/api/duo/candidates",
    "/api/duo/quests",
    "/api/duo/synergy",
    "/api/match/archive",
    "/api/match/archive/options",
    "/api/match/archive/saved",
    // The one open-ended entry outside this app's own namespace: a saved search is deleted
    // by its id, so the id cannot be written down here.
    "/api/match/archive/saved/",
    "/api/patch/impact",
    "/api/recommendations/champion-meta",
    "/api/referral/stats",
    "/api/riot/accounts",
    "/api/subscription",
];

/// Reachable from those same pages and deliberately left out.
///
/// Recorded because "not in the list" and "decided against" look identical from the list
/// alone, and the next person adding a page should not have to rediscover these.
///
/// - `/api/auth/resend-verification` — the banner's button. Confirming an address is a
///   credential act and belongs in a browser the player is sitting in front of.
/// - `/api/riot/connect` — starts an OAuth redirect, which has nowhere to land here.
/// - `/api/onboarding/reset` — a development affordance, not a feature.
/// - `/api/inngest` — the job runner's own endpoint. Nothing on a page calls it.
#[cfg(test)]
const DELIBERATELY_EXCLUDED: &[&str] = &[
    "/api/auth/resend-verification",
    "/api/riot/connect",
    "/api/onboarding/reset",
    "/api/inngest",
];

/// Whether the app may aim a request at this path.
///
/// Refuses on four counts before the prefix is even considered: a path that is not
/// absolute, one that is protocol-relative, one that walks upwards, and one that carries a
/// fragment. The first three are ways of leaving the compiled-in host — which is the whole
/// property `base_url` exists to hold — and the fourth is never meaningful to a server.
///
/// Percent-encoding is refused rather than decoded. `%2e%2e` is `..` and `%2f` is `/`, and
/// a prefix check runs before any server would decode them — so a path carrying either
/// could satisfy `/api/desktop/` here and reach somewhere else there. Nothing this app
/// asks for needs an encoded slash or dot in its *path*; a query string may carry
/// whatever it likes, which is why this runs on the route alone.
pub fn is_allowed(path: &str) -> bool {
    if !path.starts_with("/api/") {
        return false;
    }
    // `//evil.example` after a base ending in a host is a different origin.
    if path.starts_with("//") {
        return false;
    }

    // The query string is not part of what is allowed or refused — `?limit=20` does not
    // change which route answers, and a search term is allowed to contain anything.
    let route = path.split('?').next().unwrap_or(path);

    if route.contains("..") || route.contains('#') || route.contains('\\') {
        return false;
    }
    let lowered = route.to_ascii_lowercase();
    if lowered.contains("%2e") || lowered.contains("%2f") || lowered.contains("%5c") {
        return false;
    }

    ALLOWED_PATHS.iter().any(|allowed| matches(allowed, route))
}

/// Whether one allowlist entry covers this route.
///
/// Three forms, in the order they are checked: a trailing slash is a prefix, a `*` is
/// exactly one segment, and anything else is an exact match. The last is the default on
/// purpose — an entry that did nothing special would otherwise become a prefix and quietly
/// hand over whatever gets added underneath it later.
fn matches(allowed: &str, route: &str) -> bool {
    if let Some(prefix) = allowed.strip_suffix('/') {
        return route == prefix || route.starts_with(allowed);
    }

    if !allowed.contains('*') {
        return route == allowed;
    }

    // Segment by segment, so a `*` can never swallow a `/` and reach a route one level
    // deeper than the entry describes. Both sides run out together or this is not a match.
    let mut pattern = allowed.split('/');
    let mut actual = route.split('/');
    loop {
        match (pattern.next(), actual.next()) {
            (None, None) => return true,
            (Some(p), Some(a)) => {
                if p == "*" {
                    // One *real* segment. `/api/riot//performance` is not an account id, and
                    // an empty segment is how a path with a piece missing gets through a
                    // check that only counted separators.
                    if a.is_empty() {
                        return false;
                    }
                } else if p != a {
                    return false;
                }
            }
            _ => return false,
        }
    }
}

impl ApiClient {
    /// Sends one allowlisted request with the device token attached.
    ///
    /// `Ok(None)` means this machine holds no token — the same state, and the same
    /// handling, as everywhere else it is used.
    ///
    /// Note what this does *not* do: clear the token on a 401. `me()` does, because a 401
    /// there can only mean the website has disowned the device. Here it far more often
    /// means the route was never opted into `deviceAccess`, and unpairing the app over a
    /// missing flag on one endpoint would be a spectacular over-reaction.
    pub async fn proxy(
        &self,
        path: &str,
        method: &str,
        body: Option<serde_json::Value>,
    ) -> AppResult<Option<ProxyResponse>> {
        if !is_allowed(path) {
            return Err(AppError::ForbiddenPath);
        }
        let method = method.to_ascii_uppercase();
        if !ALLOWED_METHODS.contains(&method.as_str()) {
            return Err(AppError::ForbiddenPath);
        }

        let Some(token) = crate::secrets::read()? else {
            return Ok(None);
        };

        let verb = reqwest::Method::from_bytes(method.as_bytes())
            .map_err(|_| AppError::ForbiddenPath)?;

        let mut request = self
            .http
            .request(verb, format!("{}{}", base_url(), path))
            .bearer_auth(&token);

        if let Some(json) = body {
            request = request.json(&json);
        }

        let response = request
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        let status = response.status().as_u16();
        // A body that is not JSON is not a fault worth failing on: the status is the half
        // the caller acts on, and an HTML error page is still an answer.
        let body = response.json::<serde_json::Value>().await.ok();

        Ok(Some(ProxyResponse { status, body }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_pages_this_adr_ships_are_allowed() {
        for path in [
            "/api/desktop/me",
            "/api/achievements",
            "/api/achievements/seen",
            "/api/challenges",
            "/api/daily-quest",
            "/api/duo/synergy",
            "/api/match/archive?limit=20&champion=Ahri",
            "/api/match/archive/options",
            "/api/patch/impact",
            "/api/recommendations/champion-meta",
            "/api/referral/stats",
            "/api/riot/accounts",
            "/api/subscription",
        ] {
            assert!(is_allowed(path), "{path} should be reachable");
        }
    }

    /// The other half of the same reading. These are on the pages too and were left out on
    /// purpose; without this they would look like an oversight to whoever widens the list.
    #[test]
    fn the_paths_left_out_on_purpose_stay_out() {
        for path in DELIBERATELY_EXCLUDED {
            assert!(!is_allowed(path), "{path} was excluded deliberately");
        }
    }

    /// An entry without a trailing slash covers itself and nothing else.
    ///
    /// This is the test that caught `/api/subscription` reaching `retention-offer` while
    /// the list was being written, which is the whole argument for the distinction.
    #[test]
    fn an_exact_entry_does_not_become_a_prefix() {
        assert!(is_allowed("/api/subscription"));
        assert!(!is_allowed("/api/subscription/retention-offer"));
        assert!(!is_allowed("/api/subscription/cancel"));

        assert!(is_allowed("/api/referral/stats"));
        assert!(!is_allowed("/api/referral/apply"));
        assert!(!is_allowed("/api/referral/code"));

        // Not a route under `/api/achievements` — a different route whose name starts with
        // the same letters. Segment boundaries, not string prefixes.
        assert!(!is_allowed("/api/achievements-export"));
    }

    /// `/api/match/` would have swept in every match route; the archive is the only part
    /// these screens read. A trailing slash is a promise about everything under it.
    #[test]
    fn the_open_ended_entries_are_the_two_that_have_to_be() {
        // A saved search is deleted by id, so the id cannot be written down in the list.
        assert!(is_allowed("/api/match/archive/saved/abc-123"));
        assert!(is_allowed("/api/desktop/champions/Ahri"));

        assert!(!is_allowed("/api/match/sync"));
        assert!(!is_allowed("/api/riot/live-game"));
        assert!(!is_allowed("/api/riot/accounts/acc-1/disconnect"));
    }

    /// The half of the allowlist that matters. A device token is left on a machine; these
    /// are the things it must not be able to do if someone else ends up holding it.
    #[test]
    fn nothing_that_changes_a_credential_is_reachable() {
        for path in [
            "/api/auth/session",
            "/api/auth/signout",
            "/api/settings/security",
            "/api/subscription/cancel",
            "/api/lemonsqueezy/checkout",
            "/api/admin/feature-flags",
        ] {
            assert!(!is_allowed(path), "{path} must not be reachable");
        }
    }

    /// A prefix list is only as good as its refusal to be walked out of.
    #[test]
    fn a_path_cannot_leave_its_prefix_or_its_host() {
        for path in [
            "/api/desktop/../auth/session",
            "/api/desktop/%2e%2e/auth",
            "//evil.example/api/desktop/me",
            "/api/desktop/me#/api/auth",
            "/api/desktop\\..\\auth",
            "https://evil.example/api/desktop/me",
            "/liveclientdata/allgamedata",
            "/dashboard",
            "",
        ] {
            assert!(!is_allowed(path), "{path} must be refused");
        }
    }

    /// The prefix check runs before anything decodes the path, so an encoded separator is
    /// refused outright rather than trusted to mean what it looks like.
    #[test]
    fn an_encoded_separator_is_refused_in_the_route() {
        for path in [
            "/api/desktop/%2e%2e",
            "/api/desktop/%2E%2E/auth",
            "/api/desktop/%2fauth",
            "/api/desktop/%5cauth",
        ] {
            assert!(!is_allowed(path), "{path} must be refused");
        }
    }

    /// A search box is allowed to contain a slash. Only the route decides the route.
    #[test]
    fn the_query_string_does_not_decide_the_route() {
        assert!(is_allowed("/api/match/archive?q=/api/auth/session"));
        assert!(is_allowed("/api/match/archive?q=%2e%2e"));
        assert!(!is_allowed("/api/auth/session?q=/api/match/archive"));
    }

    /// The shape that crosses the IPC boundary has nowhere to put a token, the same
    /// property `api::tests::the_returned_shape_has_no_token_field` asserts for pairing.
    #[test]
    fn the_proxy_response_carries_no_credential() {
        let response = ProxyResponse {
            status: 200,
            body: Some(serde_json::json!({ "data": { "ok": true } })),
        };

        let json = serde_json::to_string(&response).unwrap();

        assert!(!json.contains("token"));
        assert!(!json.contains("authorization"));
        assert!(json.contains("\"status\":200"));
    }

    #[test]
    fn the_verbs_are_a_closed_set() {
        assert!(ALLOWED_METHODS.contains(&"GET"));
        for verb in ["TRACE", "CONNECT", "OPTIONS", "HEAD"] {
            assert!(!ALLOWED_METHODS.contains(&verb), "{verb} must not be allowed");
        }
    }

    // ── The wildcard segment ──────────────────────────────────────────────
    //
    // It exists so a route with an id in it can be named without naming its
    // siblings. Everything below is a way of asking for a sibling.

    #[test]
    fn a_wildcard_stands_for_one_segment() {
        assert!(matches("/api/riot/*/performance", "/api/riot/abc123/performance"));
        assert!(matches("/api/riot/*/plan/history", "/api/riot/abc123/plan/history"));
    }

    #[test]
    fn a_wildcard_does_not_reach_a_sibling_route() {
        // The whole reason this is not `/api/riot/`: these two spend Riot quota and money.
        assert!(!matches("/api/riot/*/performance", "/api/riot/abc123/sync"));
        assert!(!matches("/api/riot/*/performance", "/api/riot/abc123/chat"));
    }

    #[test]
    fn a_wildcard_does_not_cross_a_separator() {
        assert!(!matches("/api/riot/*/performance", "/api/riot/a/b/performance"));
        assert!(!matches("/api/riot/*", "/api/riot/abc123/sync"));
    }

    #[test]
    fn a_wildcard_needs_a_real_segment() {
        assert!(!matches("/api/riot/*/performance", "/api/riot//performance"));
    }

    #[test]
    fn a_wildcard_still_has_to_reach_the_end() {
        assert!(!matches("/api/riot/*/performance", "/api/riot/abc123"));
        assert!(!matches("/api/riot/*/performance", "/api/riot/abc123/performance/raw"));
    }

    /// The other two forms are unchanged by the wildcard's arrival.
    #[test]
    fn the_existing_forms_still_mean_what_they_meant() {
        assert!(matches("/api/subscription", "/api/subscription"));
        assert!(!matches("/api/subscription", "/api/subscription/cancel"));
        assert!(matches("/api/desktop/", "/api/desktop/anything/at/all"));
    }
}
