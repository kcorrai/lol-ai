use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::api::base_url;
use crate::error::{AppError, AppResult};

/// Following a link out of this window (ADR-047).
///
/// The companion covers the screens that belong in a companion and lists no others. The
/// rest of the site is not lifted and is not embedded; a link a lifted screen draws to it
/// opens where that page already works, in the player's own browser.
///
/// The path is the only thing the webview chooses: the host comes from `base_url()` and is
/// still decided at build time, so a webview that asked for the wrong thing can reach a
/// different page of this site and nothing else.

/// Whether this is a page of the website that the app may hand to the browser.
///
/// The same discipline `proxy::is_allowed` applies to a request path, for the same reason:
/// every rule here refuses a way of leaving the compiled-in host. Absolute, so it cannot be
/// read as a host; not protocol-relative, because `//evil.example` after a base ending in a
/// host is a different origin; no upward walk; no fragment, which this app's own router uses
/// and a server never sees.
///
/// Percent-encoding is refused rather than decoded, as it is there — `%2e%2e` is `..` and
/// `%2f` is `/`, and this check runs before any server would decode them. No page route
/// needs an encoded separator in its path; a query string may carry whatever it likes,
/// which is why this runs on the route alone.
///
/// `/api/` is refused on top of all that. Nothing under it is a page, so asking to open one
/// in a browser is a mistake rather than a request — and the way to reach an endpoint is
/// `desktop_fetch`, which has an allowlist and attaches the device token.
pub fn is_page(path: &str) -> bool {
    if !path.starts_with('/') || path.starts_with("//") {
        return false;
    }

    let route = path.split('?').next().unwrap_or(path);

    if route == "/api" || route.starts_with("/api/") {
        return false;
    }
    if route.contains("..") || route.contains('#') || route.contains('\\') {
        return false;
    }
    // A control character never appears in a route and is one of the ways an address is
    // made to read as something other than what it opens.
    if route.chars().any(char::is_control) {
        return false;
    }

    let lowered = route.to_ascii_lowercase();
    !(lowered.contains("%2e") || lowered.contains("%2f") || lowered.contains("%5c"))
}

/// The address a page is opened at. Built from the compiled-in base, never from the webview.
fn page_url(path: &str) -> String {
    format!("{}{}", base_url(), path)
}

/// Hands one page of the website to the operating system's default browser.
///
/// Deliberately not a webview navigation: this window is a companion to a running game and
/// must not become a browser.
pub fn open(app: &AppHandle, path: &str) -> AppResult<()> {
    if !is_page(path) {
        return Err(AppError::ForbiddenPath);
    }

    app.opener()
        .open_url(page_url(path), None::<&str>)
        .map_err(|e| AppError::Browser(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ordinary_pages_are_allowed() {
        assert!(is_page("/"));
        assert!(is_page("/pricing"));
        assert!(is_page("/coaches"));
        assert!(is_page("/u/some-player"));
        assert!(is_page("/match/TR1_1234567890"));
    }

    #[test]
    fn a_query_string_may_carry_anything() {
        assert!(is_page("/matches?champion=Nunu%20%26%20Willump"));
        assert!(is_page("/leaderboard?region=tr&page=2"));
        // Refused in the route, allowed after the `?` — a search term is not a path.
        assert!(is_page("/matches?q=..%2f"));
    }

    #[test]
    fn a_path_that_could_leave_this_host_is_refused() {
        assert!(!is_page("https://evil.example/"));
        assert!(!is_page("//evil.example/"));
        assert!(!is_page("pricing"));
        assert!(!is_page("/../../etc/passwd"));
        assert!(!is_page("/\\evil.example"));
    }

    #[test]
    fn an_encoded_separator_is_refused_rather_than_decoded() {
        assert!(!is_page("/%2e%2e/admin"));
        assert!(!is_page("/foo%2Fbar"));
        assert!(!is_page("/foo%5Cbar"));
    }

    /// The fragment is this app's own router's vocabulary, and no server ever receives one.
    #[test]
    fn a_fragment_is_refused() {
        assert!(!is_page("/dashboard#/settings"));
    }

    /// Endpoints are `desktop_fetch`'s business. A browser opening one would answer JSON to
    /// a player, in a session this app deliberately does not share.
    #[test]
    fn api_paths_are_not_pages() {
        assert!(!is_page("/api"));
        assert!(!is_page("/api/desktop/champions"));
        assert!(!is_page("/api/subscription?x=1"));
        // Not a prefix match on the word: a page may legitimately begin with these letters.
        assert!(is_page("/apiary"));
    }

    #[test]
    fn a_control_character_is_refused() {
        assert!(!is_page("/pric\ning"));
        assert!(!is_page("/pricing\u{0}"));
    }

    #[test]
    fn the_url_is_built_on_the_compiled_in_base() {
        assert_eq!(page_url("/pricing"), format!("{}/pricing", base_url()));
    }
}
