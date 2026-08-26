import { describe, expect, it } from "vitest";
import { accelerator, hasHoldingModifier, keyName, readableShortcut } from "./shortcut";

/** A press with nothing held, which every test then adds to. */
function press(code: string, held: Partial<Record<"ctrl" | "alt" | "shift" | "meta", true>> = {}) {
  return {
    code,
    ctrlKey: held.ctrl === true,
    altKey: held.alt === true,
    shiftKey: held.shift === true,
    metaKey: held.meta === true,
  };
}

describe("hasHoldingModifier", () => {
  /**
   * The rule this whole module exists for. A global shortcut takes the key away from the
   * game, so a player who bound plain `L` would find their champion no longer casting it.
   */
  it("refuses a bare key", () => {
    expect(hasHoldingModifier(press("KeyL"))).toBe(false);
  });

  it("refuses shift on its own, which is not a modifier the game does not also see", () => {
    expect(hasHoldingModifier(press("KeyL", { shift: true }))).toBe(false);
  });

  it("accepts any of the three that actually hold a key", () => {
    expect(hasHoldingModifier(press("KeyL", { ctrl: true }))).toBe(true);
    expect(hasHoldingModifier(press("KeyL", { alt: true }))).toBe(true);
    expect(hasHoldingModifier(press("KeyL", { meta: true }))).toBe(true);
  });
});

describe("keyName", () => {
  it("names the keys a shortcut is usually built from", () => {
    expect(keyName("KeyL")).toBe("L");
    expect(keyName("Digit7")).toBe("7");
    expect(keyName("F9")).toBe("F9");
    expect(keyName("Space")).toBe("Space");
    expect(keyName("Slash")).toBe("/");
  });

  /** Modifiers are held, not pressed. A combination of nothing but them is still being chosen. */
  it("does not name a modifier", () => {
    for (const code of ["ControlLeft", "AltRight", "ShiftLeft", "MetaLeft"]) {
      expect(keyName(code)).toBeNull();
    }
  });

  /** Each of these is owned by the game or the window manager, or hit by accident. */
  it("leaves out the keys nobody should be able to bind", () => {
    for (const code of ["Escape", "Tab", "Enter", "ArrowUp", "Numpad5", "F25"]) {
      expect(keyName(code)).toBeNull();
    }
  });
});

describe("accelerator", () => {
  it("writes what the core registers", () => {
    expect(accelerator(press("KeyL", { ctrl: true, alt: true }))).toBe("Control+Alt+L");
  });

  /**
   * Fixed order, so two players who pressed the same keys in a different order get the same
   * string — and so the tray's label does not depend on which finger landed first.
   */
  it("writes the modifiers in one order whatever order they were pressed in", () => {
    const every = press("KeyO", { meta: true, shift: true, alt: true, ctrl: true });
    expect(accelerator(every)).toBe("Control+Alt+Shift+Super+O");
  });

  it("shift counts once something is holding the key", () => {
    expect(accelerator(press("KeyO", { ctrl: true, shift: true }))).toBe("Control+Shift+O");
  });

  it("is nothing until the press is a combination", () => {
    expect(accelerator(press("KeyL"))).toBeNull();
    expect(accelerator(press("ControlLeft", { ctrl: true }))).toBeNull();
    expect(accelerator(press("Escape", { ctrl: true }))).toBeNull();
  });
});

describe("readableShortcut", () => {
  /** `CmdOrCtrl` is a portability token, not a key anybody's keyboard has. */
  it("draws the default the way the tray does", () => {
    expect(readableShortcut("CmdOrCtrl+Alt+L")).toBe("Ctrl+Alt+L");
  });

  it("draws what this module itself writes", () => {
    expect(readableShortcut("Control+Alt+L")).toBe("Ctrl+Alt+L");
    expect(readableShortcut("Super+Shift+O")).toBe("Win+Shift+O");
  });
});
