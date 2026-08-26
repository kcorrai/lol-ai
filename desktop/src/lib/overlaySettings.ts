/**
 * What the overlay draws, and how heavily.
 *
 * Kept apart from the settings the Rust core holds, and deliberately: the shortcut has to be
 * registered with the operating system and the position has to be applied to a window, so
 * both belong to the core. Which panels are on and how solid they look are drawing
 * decisions the webview makes for itself, and routing them through the core would buy a
 * round trip and nothing else.
 *
 * Stored the way `useSidebarCollapsed` stores its one boolean — `localStorage`, read on
 * mount, written on change. Both windows load the same document from the same origin, so
 * the overlay reads what the Settings screen wrote; it also listens for the `storage` event,
 * which is what makes a panel switch take effect over a running game rather than at the next
 * launch.
 */

/** The panels the overlay can draw, in the order it draws them. */
export const OVERLAY_PANELS = ["performance", "matchup", "build", "timeline"] as const;
export type OverlayPanel = (typeof OVERLAY_PANELS)[number];

export interface OverlayDrawing {
  panels: readonly OverlayPanel[];
  /** How opaque the panels are, 0.4 to 1. */
  opacity: number;
}

/**
 * What the overlay draws for a player who has never changed it.
 *
 * The three it has always had. The timeline is off by default: the overlay is a glance and a
 * list of what already happened is a second look, which belongs in the window that can be
 * scrolled. It is one switch away for the players who want it there.
 */
export const DEFAULT_DRAWING: OverlayDrawing = {
  panels: ["performance", "matchup", "build"],
  opacity: 1,
};

export const STORAGE_KEY = "lolai.desktop.overlay-drawing";

/**
 * Below this the panels stop being readable against a moving game, which makes the setting
 * a way to break the overlay rather than to tune it.
 */
export const MIN_OPACITY = 0.4;

/**
 * Whatever was stored, or the defaults.
 *
 * Every field is checked on the way out rather than trusted. This value survives an upgrade,
 * so a build that adds a panel will read files written by one that did not, and a build that
 * removes one will read files that still name it — an unknown name is dropped rather than
 * rendered, and a missing field falls back rather than blanking the overlay.
 *
 * A function rather than a branch inside the hook: this suite runs in node with no DOM, so
 * the hook cannot be rendered and the rule it turns on has to be reachable on its own.
 */
export function parseDrawing(raw: string | null): OverlayDrawing {
  if (!raw) return DEFAULT_DRAWING;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_DRAWING;
  }
  if (typeof parsed !== "object" || parsed === null) return DEFAULT_DRAWING;

  const stored = parsed as { panels?: unknown; opacity?: unknown };

  const storedPanels: unknown[] | null = Array.isArray(stored.panels) ? stored.panels : null;
  const panels = storedPanels
    ? OVERLAY_PANELS.filter((panel) => storedPanels.includes(panel))
    : DEFAULT_DRAWING.panels;

  return { panels, opacity: parseOpacity(stored.opacity) };
}

/**
 * A number between {@link MIN_OPACITY} and 1, or the default.
 *
 * Clamped rather than refused: a stored 0 is a value this app could have written in some
 * later version, and the honest answer to it is the closest one that still shows something.
 */
export function parseOpacity(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_DRAWING.opacity;
  return Math.min(1, Math.max(MIN_OPACITY, value));
}

export function readDrawing(): OverlayDrawing {
  try {
    return parseDrawing(globalThis.localStorage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return DEFAULT_DRAWING;
  }
}

export function writeDrawing(drawing: OverlayDrawing): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(drawing));
  } catch {
    // Nothing to do and nothing to say. A preference that would not save is a preference
    // that holds for this session, which is better than an error over a running game.
  }
}

/**
 * The same list with one panel turned on or off.
 *
 * Order comes from {@link OVERLAY_PANELS} rather than from the order they were switched on,
 * so the overlay draws its panels in the same order every time — a window whose contents
 * rearrange themselves is one a player has to read rather than glance at.
 */
export function withPanel(
  drawing: OverlayDrawing,
  panel: OverlayPanel,
  shown: boolean
): OverlayDrawing {
  const wanted = new Set(drawing.panels);
  if (shown) wanted.add(panel);
  else wanted.delete(panel);
  return { ...drawing, panels: OVERLAY_PANELS.filter((each) => wanted.has(each)) };
}
