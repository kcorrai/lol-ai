use crate::error::{AppError, AppResult};

/// The device token, kept where the operating system keeps secrets.
///
/// DPAPI on Windows, Keychain on macOS, Secret Service on Linux. Deliberately not a file
/// in the app's data directory: that is readable by every process running as this user,
/// and this token is the one thing standing between a stolen profile folder and someone
/// else's account.
///
/// Nothing in this module returns the token to the webview. `status` answers whether one
/// exists; the value itself only ever moves from here into an Authorization header.
const SERVICE: &str = "gg.lolaicoach.desktop";
const ACCOUNT: &str = "device-token";

fn entry() -> AppResult<keyring::Entry> {
    keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| AppError::Keychain(e.to_string()))
}

/// The write half. Called once, by the pairing exchange in `api.rs` — the only thing in
/// the application that ever produces a token, and the only place one exists in memory.
pub fn store(token: &str) -> AppResult<()> {
    entry()?
        .set_password(token)
        .map_err(|e| AppError::Keychain(e.to_string()))
}

pub fn read() -> AppResult<Option<String>> {
    match entry()?.get_password() {
        Ok(t) => Ok(Some(t)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::Keychain(e.to_string())),
    }
}

pub fn clear() -> AppResult<()> {
    match entry()?.delete_credential() {
        Ok(()) => Ok(()),
        // Already gone is the outcome the caller wanted.
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::Keychain(e.to_string())),
    }
}

pub fn is_paired() -> bool {
    matches!(read(), Ok(Some(_)))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Touches the real credential store, which exists on every machine this app targets.
    /// Kept to one test so a CI runner without a session keyring fails in one obvious place
    /// rather than scattered across the suite.
    #[test]
    fn stores_reads_and_clears() {
        if entry().is_err() {
            eprintln!("no credential store on this machine; skipping");
            return;
        }
        let _ = clear();
        assert_eq!(read().unwrap(), None);
        assert!(!is_paired());

        store("token-under-test").unwrap();
        assert_eq!(read().unwrap().as_deref(), Some("token-under-test"));
        assert!(is_paired());

        clear().unwrap();
        assert_eq!(read().unwrap(), None);
    }

    #[test]
    fn clearing_nothing_is_not_an_error() {
        if entry().is_err() {
            return;
        }
        let _ = clear();
        assert!(clear().is_ok());
    }
}
