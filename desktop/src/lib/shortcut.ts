/**
 * Turning a key press into something the core can register.
 *
 * The player presses the combination they want and the app writes it down, rather than
 * typing an accelerator string nobody could be expected to know the syntax of. What comes
 * out here goes straight to `set_overlay_shortcut`, which hands it to the operating system —
 * so this has to produce the vocabulary Tauri parses, and refuse anything else rather than
 * pass it on to be rejected with a message about syntax.
 */

/** The parts of a `KeyboardEvent` this needs, so the rule can be tested without a DOM. */
export interface KeyPress {
  /** `KeyboardEvent.code` — the physical key, not the character it produces. */
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * Why a modifier is required.
 *
 * This registers a *global* shortcut: the operating system takes the key away from whatever
 * has focus, and what has focus is a game. A player who bound plain `L` would find their
 * champion no longer casting it, and would have no way to work out why. Shift alone does not
 * count — `Shift+A` is still a key the game sees as `A`.
 */
export function hasHoldingModifier(press: KeyPress): boolean {
  return press.ctrlKey || press.altKey || press.metaKey;
}

/**
 * The key itself, or `null` when it is one this cannot name.
 *
 * Read off `code` rather than `key`: `key` is the character the layout produced, so the same
 * physical key gives `L` on one keyboard and something else on another, and the accelerator
 * would stop matching when the player switched layout. `code` is the key's position.
 *
 * Modifiers return `null` here on purpose — they are held, not pressed, and a combination
 * that is nothing but modifiers is a player still choosing.
 */
export function keyName(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;

  switch (code) {
    case "Space":
      return "Space";
    case "Backquote":
      return "`";
    case "Minus":
      return "-";
    case "Equal":
      return "=";
    case "BracketLeft":
      return "[";
    case "BracketRight":
      return "]";
    case "Backslash":
      return "\\";
    case "Semicolon":
      return ";";
    case "Quote":
      return "'";
    case "Comma":
      return ",";
    case "Period":
      return ".";
    case "Slash":
      return "/";
    default:
      // Arrows, Escape, Tab, Enter and the numeric keypad are all left out deliberately.
      // Each is either something the game or the window manager already owns, or something
      // a player would press by accident while choosing.
      return null;
  }
}

/**
 * The accelerator for a press, or `null` when the press is not one yet.
 *
 * Modifiers are written in a fixed order so two players who pressed the same keys in a
 * different order get the same string, and so the label under the tray icon is stable.
 *
 * `Control` rather than `CmdOrCtrl`: this is built from keys that were actually held, and
 * `CmdOrCtrl` means two different keys on two different platforms. The default the app ships
 * with is still written the portable way — Tauri parses both, and the default has to be
 * right on a machine nobody has pressed anything on yet.
 */
export function accelerator(press: KeyPress): string | null {
  if (!hasHoldingModifier(press)) return null;

  const key = keyName(press.code);
  if (!key) return null;

  const parts: string[] = [];
  if (press.ctrlKey) parts.push("Control");
  if (press.altKey) parts.push("Alt");
  if (press.shiftKey) parts.push("Shift");
  if (press.metaKey) parts.push("Super");
  parts.push(key);

  return parts.join("+");
}

/**
 * How an accelerator is drawn for a person.
 *
 * The same treatment the tray menu gives it in `lib.rs`, for the same reason: `CmdOrCtrl` is
 * a portability token and not a key anybody's keyboard has.
 */
export function readableShortcut(value: string): string {
  return value.replace("CmdOrCtrl", "Ctrl").replace("Control", "Ctrl").replace("Super", "Win");
}
