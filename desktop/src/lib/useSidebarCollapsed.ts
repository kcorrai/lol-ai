import { useCallback, useEffect, useState } from "react";

/**
 * Whether the sidebar is drawn as the icon rail or with its labels.
 *
 * The website keeps the same choice, in `useUIStore`, persisted. ADR-039 shares the design
 * system between the two products and not their stores, so this is the same behaviour by
 * its own small means: a boolean in `localStorage`, read once on mount. A companion that
 * runs beside a game should not carry zustand to remember one boolean.
 *
 * **Collapsed is the default**, and stays the default for a new machine. The rail is narrow
 * on purpose — every pixel it takes is one the player is not spending on the game — so the
 * window opens the way it was designed to sit next to a match, and widens only because
 * somebody asked it to.
 */
const KEY = "lolai.desktop.sidebar-collapsed";

/**
 * What a stored value means, separated from the hook so the rule can be tested without a
 * DOM. Anything that is not the exact string this module writes reads as the default —
 * a value left by an older build, or by a hand, is not worth honouring.
 */
export function parseCollapsed(raw: string | null): boolean {
  if (raw === "false") return false;
  return true;
}

/**
 * Reads through a `try`, because storage is not always there to be read.
 *
 * A webview with site data blocked throws on access rather than answering null, and a
 * sidebar that cannot remember its width is not a reason to fail to draw one.
 */
function read(): boolean {
  try {
    return parseCollapsed(globalThis.localStorage?.getItem(KEY) ?? null);
  } catch {
    return true;
  }
}

function write(collapsed: boolean): void {
  try {
    globalThis.localStorage?.setItem(KEY, String(collapsed));
  } catch {
    // Nothing to do and nothing to say: the choice holds for this session either way.
  }
}

export function useSidebarCollapsed(): {
  collapsed: boolean;
  toggle: () => void;
} {
  // Read in an effect rather than in the initial state, so the first render is the same
  // whether or not storage answered. The window is 1100px wide and the rail is 56px of it;
  // a frame drawn collapsed before a stored `false` arrives is a 168px shift nobody minds,
  // where a throw during render is a white window.
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setCollapsed(read());
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      write(next);
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
