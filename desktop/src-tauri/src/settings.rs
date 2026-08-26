use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// Where the overlay sits, and what opens it.
///
/// The one thing in this app that is remembered on disk. Everything else is either read
/// back from the system that owns it — the credential store holds the token, the operating
/// system holds the start-up list — or is a drawing preference the webview keeps for
/// itself. These three are neither: the shortcut is registered by the core, the position is
/// applied by the core, and a player who moved the overlay to their second monitor should
/// not have to do it again tomorrow.
///
/// **Why this is not `tauri-plugin-store`.** That plugin's value is a key-value store the
/// *webview* can reach, and the webview is granted nothing in this app — no filesystem, no
/// window sizing, no arbitrary HTTP (`capabilities/default.json`). Reading and writing one
/// small file from Rust adds no permission to that list and no dependency to the bundle.
///
/// A file that cannot be read, or that carries something this version does not understand,
/// is treated as a machine that has never been asked. Defaults are the position and
/// shortcut this app shipped with, so an unreadable settings file costs the player their
/// preference and never the overlay.

/// The shortcut the app ships with.
///
/// Held deliberately away from anything the game binds. A companion that stole a key the
/// player needs mid-fight would be uninstalled the first time it happened, and Ctrl+Alt
/// combinations are not what a game reaches for. It is only the *default* now — the point
/// of this module is that a player whose own bindings collide with it can move it.
pub const DEFAULT_SHORTCUT: &str = "CmdOrCtrl+Alt+L";

/// The offsets this app shipped with, kept as the defaults so an upgrade does not move a
/// window somebody had already got used to.
const DEFAULT_DX: f64 = 24.0;
const DEFAULT_DY: f64 = 96.0;

/// Which corner of the chosen screen the overlay is measured from.
///
/// Corners rather than free coordinates because a corner survives a resolution change and a
/// coordinate does not. A player who set "bottom right, 24 across, 96 up" on a 1440p monitor
/// and then plugs in a 1080p one still gets the bottom right corner; a saved `x: 2536` would
/// put the window off the side of the screen.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Corner {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

impl Corner {
    fn from_the_right(self) -> bool {
        matches!(self, Corner::TopRight | Corner::BottomRight)
    }

    fn from_the_bottom(self) -> bool {
        matches!(self, Corner::BottomLeft | Corner::BottomRight)
    }
}

/// A rectangle in logical pixels.
///
/// Its own type rather than Tauri's, because everything worth testing here is arithmetic on
/// four numbers and a test that needs a monitor is a test nobody runs.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlaySettings {
    pub shortcut: String,
    /// The screen's name as the operating system reports it, or `None` for "wherever the
    /// window already is".
    ///
    /// A name rather than an index: monitor order changes when a cable moves, and a saved
    /// index would silently mean a different screen. A name that no longer matches any
    /// attached monitor falls back to the current one rather than failing — an overlay on
    /// the wrong screen is recoverable, an overlay that refuses to appear is not.
    pub monitor: Option<String>,
    pub corner: Corner,
    /// Distance from the chosen corner, in logical pixels, always inward.
    pub dx: f64,
    pub dy: f64,
}

impl Default for OverlaySettings {
    fn default() -> Self {
        Self {
            shortcut: DEFAULT_SHORTCUT.to_string(),
            monitor: None,
            corner: Corner::TopLeft,
            dx: DEFAULT_DX,
            dy: DEFAULT_DY,
        }
    }
}

/// Where the overlay's top-left corner goes.
///
/// Both offsets are inward from the named corner, so "24 and 96" means the same distance
/// from the edge whichever corner is chosen, and a player moving the window from one corner
/// to another keeps the margin they picked.
///
/// The result is clamped into the work area. An offset larger than the screen is a number a
/// player can type, and a window pushed off its own monitor by it would be one they could
/// not get back — the shortcut would toggle something invisible.
pub fn position_for(work_area: Rect, corner: Corner, dx: f64, dy: f64, size: (f64, f64)) -> (f64, f64) {
    let (width, height) = size;

    let x = if corner.from_the_right() {
        work_area.x + work_area.width - width - dx
    } else {
        work_area.x + dx
    };
    let y = if corner.from_the_bottom() {
        work_area.y + work_area.height - height - dy
    } else {
        work_area.y + dy
    };

    // `max` after `min` so a window taller or wider than the work area lands at the top-left
    // of it rather than off the top: the edge that gets cut is the one furthest from the
    // corner the player named.
    (
        x.min(work_area.x + work_area.width - width).max(work_area.x),
        y.min(work_area.y + work_area.height - height).max(work_area.y),
    )
}

/// How much room the overlay has to grow into, given the corner it is measured from.
///
/// The same expression for every corner, which is not a coincidence: a top-anchored window
/// runs from its own top edge to the bottom of the work area, and a bottom-anchored one from
/// the top of the work area to its own bottom edge. Both are the work area's height less the
/// margin the player asked for.
pub fn available_height(work_area_height: f64, dy: f64) -> f64 {
    (work_area_height - dy).max(0.0)
}

/// The file, or `None` when this build has no config directory to put it in.
fn path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|dir| dir.join("overlay.json"))
}

/// What was last saved, or the defaults.
///
/// Never fails. A missing file is a machine that has not been asked, an unreadable one is a
/// machine whose answer cannot be heard, and the app behaves the same way in both: it draws
/// the overlay where it has always drawn it.
pub fn load(app: &AppHandle) -> OverlaySettings {
    let Some(path) = path(app) else {
        return OverlaySettings::default();
    };
    let Ok(raw) = fs::read_to_string(&path) else {
        return OverlaySettings::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

/// Writes the settings, and says whether it managed.
///
/// The caller decides what a failure means. Moving the window and failing to remember it is
/// worth saying out loud in Settings — the player would otherwise find out tomorrow — but it
/// is not worth refusing to move the window over.
pub fn save(app: &AppHandle, settings: &OverlaySettings) -> Result<(), String> {
    let path = path(app).ok_or_else(|| "This machine has no configuration directory.".to_string())?;

    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|err| err.to_string())?;
    }
    let body = serde_json::to_string_pretty(settings).map_err(|err| err.to_string())?;
    fs::write(&path, body).map_err(|err| err.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A 1920x1080 screen with a taskbar along the bottom, which is the shape nearly every
    /// Windows machine running this app has.
    const WORK: Rect = Rect { x: 0.0, y: 0.0, width: 1920.0, height: 1040.0 };
    const SIZE: (f64, f64) = (340.0, 620.0);

    #[test]
    fn the_default_is_where_the_app_has_always_drawn_it() {
        let settings = OverlaySettings::default();
        assert_eq!(
            position_for(WORK, settings.corner, settings.dx, settings.dy, SIZE),
            (24.0, 96.0)
        );
    }

    #[test]
    fn the_right_hand_corners_measure_from_the_right_edge() {
        assert_eq!(position_for(WORK, Corner::TopRight, 24.0, 96.0, SIZE), (1556.0, 96.0));
    }

    #[test]
    fn the_bottom_corners_measure_from_the_bottom_edge() {
        assert_eq!(position_for(WORK, Corner::BottomLeft, 24.0, 96.0, SIZE), (24.0, 324.0));
        assert_eq!(position_for(WORK, Corner::BottomRight, 24.0, 96.0, SIZE), (1556.0, 324.0));
    }

    /// A second monitor sits at an offset, and every corner is relative to *its* origin.
    #[test]
    fn a_screen_that_starts_somewhere_else_is_measured_from_its_own_corner() {
        let second = Rect { x: 1920.0, y: 0.0, width: 1920.0, height: 1040.0 };
        assert_eq!(position_for(second, Corner::TopLeft, 24.0, 96.0, SIZE), (1944.0, 96.0));
    }

    /// The number a player can type that would otherwise lose them the window.
    #[test]
    fn an_offset_bigger_than_the_screen_stays_on_the_screen() {
        let (x, y) = position_for(WORK, Corner::TopLeft, 9000.0, 9000.0, SIZE);
        assert_eq!((x, y), (1580.0, 420.0));
    }

    #[test]
    fn a_window_larger_than_the_screen_lands_at_its_origin() {
        let tiny = Rect { x: 0.0, y: 0.0, width: 200.0, height: 200.0 };
        assert_eq!(position_for(tiny, Corner::TopLeft, 24.0, 96.0, SIZE), (0.0, 0.0));
    }

    #[test]
    fn the_room_to_grow_is_the_screen_less_the_margin() {
        assert_eq!(available_height(1040.0, 96.0), 944.0);
        assert_eq!(available_height(1040.0, 0.0), 1040.0);
    }

    /// A margin past the bottom of the screen would otherwise ask for a negative height.
    #[test]
    fn a_margin_past_the_screen_leaves_no_room_rather_than_negative_room() {
        assert_eq!(available_height(1040.0, 2000.0), 0.0);
    }

    /// The failure this module is written around: a settings file from a later version, or
    /// a corrupted one, must cost the preference and never the overlay.
    #[test]
    fn a_file_this_version_cannot_read_is_a_machine_that_was_never_asked() {
        let unreadable: OverlaySettings = serde_json::from_str("{\"corner\":\"middle\"}")
            .unwrap_or_default();
        assert_eq!(unreadable, OverlaySettings::default());
    }

    #[test]
    fn what_it_writes_it_can_read_back() {
        let settings = OverlaySettings {
            shortcut: "Control+Shift+O".into(),
            monitor: Some("\\\\.\\DISPLAY2".into()),
            corner: Corner::BottomRight,
            dx: 12.0,
            dy: 12.0,
        };
        let round_tripped: OverlaySettings =
            serde_json::from_str(&serde_json::to_string(&settings).unwrap()).unwrap();
        assert_eq!(round_tripped, settings);
    }
}
