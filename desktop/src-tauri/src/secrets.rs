use crate::error::{AppError, AppResult};

/// The device token, kept where the operating system keeps secrets.
///
/// DPAPI on Windows, Keychain on macOS, Secret Service on Linux. Deliberately not a file
/// in the app's data directory: that is readable by every process running as this user,
/// and this token is the one thing standing between a stolen profile folder and someone
/// else's account.
///
/// Nothing in this module returns the token to the webview. `read` is the only way in, and
/// `device_status` turns its three answers into the three the UI can say; the value itself
/// only ever moves from here into an Authorization header.
const SERVICE: &str = "gg.lolaicoach.desktop";
const ACCOUNT: &str = "device-token";

/// The credential store is shared with every other process on the machine, including a
/// `cargo test` run on the developer's own paired laptop. Every operation therefore names
/// the entry it acts on, so the tests below can be given one of their own rather than
/// deleting the token the developer is signed in with (LA-91).
fn entry_at(service: &str, account: &str) -> AppResult<keyring::Entry> {
    keyring::Entry::new(service, account).map_err(|e| AppError::Keychain(e.to_string()))
}

fn entry() -> AppResult<keyring::Entry> {
    entry_at(SERVICE, ACCOUNT)
}

fn set(entry: &keyring::Entry, token: &str) -> AppResult<()> {
    entry
        .set_password(token)
        .map_err(|e| AppError::Keychain(e.to_string()))
}

fn get(entry: &keyring::Entry) -> AppResult<Option<String>> {
    match entry.get_password() {
        Ok(t) => Ok(Some(t)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::Keychain(e.to_string())),
    }
}

fn delete(entry: &keyring::Entry) -> AppResult<()> {
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        // Already gone is the outcome the caller wanted.
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::Keychain(e.to_string())),
    }
}

/// The write half. Called once, by the pairing exchange in `api.rs` — the only thing in
/// the application that ever produces a token, and the only place one exists in memory.
pub fn store(token: &str) -> AppResult<()> {
    set(&entry()?, token)
}

pub fn read() -> AppResult<Option<String>> {
    get(&entry()?)
}

pub fn clear() -> AppResult<()> {
    delete(&entry()?)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A store the tests own outright. Naming the real entry here is what unpaired the
    /// developer's machine every time the suite ran: `cargo test` reached into the same
    /// credential the running app reads, cleared it, and left the app to open on the
    /// pairing screen with the device row still live in the database (LA-91).
    const TEST_SERVICE: &str = "gg.lolaicoach.desktop.tests";

    fn test_entry(name: &str) -> Option<keyring::Entry> {
        entry_at(TEST_SERVICE, name).ok()
    }

    /// Touches the real credential store, which exists on every machine this app targets.
    /// Kept to one test so a CI runner without a session keyring fails in one obvious place
    /// rather than scattered across the suite.
    #[test]
    fn stores_reads_and_clears() {
        let Some(entry) = test_entry("round-trip") else {
            eprintln!("no credential store on this machine; skipping");
            return;
        };
        let _ = delete(&entry);
        assert_eq!(get(&entry).unwrap(), None);

        set(&entry, "token-under-test").unwrap();
        assert_eq!(get(&entry).unwrap().as_deref(), Some("token-under-test"));

        delete(&entry).unwrap();
        assert_eq!(get(&entry).unwrap(), None);
    }

    #[test]
    fn clearing_nothing_is_not_an_error() {
        let Some(entry) = test_entry("clear-twice") else {
            return;
        };
        let _ = delete(&entry);
        assert!(delete(&entry).is_ok());
    }

    /// The guard rail for the bug itself: whatever the tests write, they must not write it
    /// where the application looks.
    #[test]
    fn tests_never_name_the_entry_the_app_reads() {
        assert_ne!(TEST_SERVICE, SERVICE);
    }

    /// The account the app reads is a fixed name; a typo in it would silently unpair every
    /// installed copy at once, which no other test in the suite would notice.
    #[test]
    fn the_app_reads_one_fixed_entry() {
        assert_eq!(SERVICE, "gg.lolaicoach.desktop");
        assert_eq!(ACCOUNT, "device-token");
    }
}
