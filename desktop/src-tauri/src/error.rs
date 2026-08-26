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

    /// Champion select sits behind the LCU, which Riot does not support for third-party
    /// applications and gates behind per-release approval (ADR-038). Builds without the
    /// `lcu` feature answer this rather than pretending the client is simply closed —
    /// "not built in" and "not running" are different things, and only one of them is
    /// something the player could fix.
    #[error("champion select is not available in this build")]
    LcuDisabled,

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

    #[error("could not open your browser: {0}")]
    Browser(String),

    /// The operating system would not give this app the key combination. Usually because
    /// something else already holds it — which is exactly the situation the player is trying
    /// to get out of by changing it, so the message has to reach them rather than a log.
    #[error("this machine would not give that shortcut to the app: {0}")]
    Shortcut(String),

    /// The overlay moved and the app could not write down where. Worth saying out loud,
    /// because the window is where it was asked to be and will not be there tomorrow.
    #[error("could not remember that: {0}")]
    Settings(String),

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
