use serde::Serialize;

/// Errors that cross the IPC boundary.
///
/// Every variant is something the UI can say out loud. Nothing here carries a token, a
/// header or a certificate — an error message is the easiest way to leak a secret into a
/// log file, and this app holds one that must never reach either.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("the webview asked for a path this app does not serve")]
    ForbiddenPath,

    #[error("could not reach the League client: {0}")]
    Transport(String),

    #[error("the League client answered with status {0}")]
    Status(u16),

    #[error("the League client's answer was not JSON: {0}")]
    Malformed(String),

    #[error("the operating system's credential store refused: {0}")]
    Keychain(String),

    #[error("could not reach LoL AI Coach: {0}")]
    Network(String),

    /// The website's own message, passed through. Those strings are written for the player
    /// — "that pairing code is not valid", "revoke one in Settings" — and are the only thing
    /// that tells them what to do next. Nothing on that path carries a token.
    #[error("{0}")]
    Api(String),
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
