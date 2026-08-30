import { useCallback, useEffect, useState } from "react";
import { HudPanel } from "@/components/layout/HudPanel";
import { SettingRow, Switch } from "@/components/settings/Switch";
import { cn } from "@/lib/cn";
import { MIN_OPACITY, OVERLAY_PANELS, type OverlayPanel } from "@/lib/overlaySettings";
import { accelerator, readableShortcut, type KeyPress } from "@/lib/shortcut";
import {
  useOverlayDrawing,
  useOverlayPlacement,
  type Corner,
  type MonitorInfo,
} from "@/lib/useOverlaySettings";

/**
 * Everything about the window that sits over the game.
 *
 * The competitors all have this and this app had none of it: one shortcut nobody could
 * change, one corner of one screen, and three panels that were always on. A player whose own
 * bindings collide with Ctrl+Alt+L had no way out, and a player on two monitors had no way to
 * put the overlay on the one the game is not on.
 *
 * What is *not* here is dragging the window itself. Every competitor moves their overlay that
 * way; it costs them a window that takes focus, and this one must never — taking the keyboard
 * out of a running game is the thing the app is written around not doing (ADR-038). A corner
 * and a margin get to the same place without asking the player to click on the game.
 */
export function OverlaySettingsPanel(): React.ReactElement {
  const { state, setShortcut, setPosition } = useOverlayPlacement();
  const { drawing, togglePanel, setOpacity } = useOverlayDrawing();

  const placement = state.status === "ready" || state.status === "error" ? state.placement : null;
  const monitors = state.status === "ready" || state.status === "error" ? state.monitors : [];
  // Two different failures, and the player can only act on one of them. "Unreadable" is a
  // core that would not answer; "error" is a core that answered no to something they asked
  // for, and it carries the words the system used.
  const error = state.status === "error" || state.status === "unreadable" ? state.message : null;

  return (
    <HudPanel title="Overlay">
      <div className="grid gap-5">
        <SettingRow
          label="Shortcut"
          description={
            placement
              ? "Shows this game's reading over the top of the game, and hides it again. The tray menu does the same thing."
              : state.status === "unreadable"
                ? "The app could not read where the overlay is. The tray menu still reaches it."
                : "This preview has no window to place. Run the desktop app."
          }
          control={
            placement ? (
              <ShortcutField current={placement.shortcut} onChange={setShortcut} />
            ) : (
              <Unavailable />
            )
          }
          error={error}
        />

        {placement ? (
          <>
            <SettingRow
              label="Screen"
              description="Put it on the monitor the game is not on, if you have one."
              control={
                <ScreenPicker
                  monitors={monitors}
                  chosen={placement.monitor}
                  onChange={(monitor) => void setPosition({ ...placement, monitor })}
                />
              }
            />

            <div>
              <p className="text-sm text-text">Corner</p>
              <p className="mt-1 text-xs text-text-muted">
                Measured from the corner rather than saved as a coordinate, so it stays put when you
                change resolution.
              </p>
              <CornerPicker
                chosen={placement.corner}
                onChange={(corner) => void setPosition({ ...placement, corner })}
              />
              <Margins
                dx={placement.dx}
                dy={placement.dy}
                onChange={(dx, dy) => void setPosition({ ...placement, dx, dy })}
              />
            </div>
          </>
        ) : null}

        <div className="border-t border-line-1 pt-4">
          <p className="text-sm text-text">What it draws</p>
          <p className="mt-1 text-xs text-text-muted">
            The same panels as the main window. Turning one off here does not turn it off there.
          </p>
          <div className="mt-3 grid gap-3">
            {OVERLAY_PANELS.map((panel) => (
              <SettingRow
                key={panel}
                label={PANEL_LABELS[panel]}
                description={PANEL_NOTES[panel]}
                control={
                  <Switch
                    label={PANEL_LABELS[panel]}
                    checked={drawing.panels.includes(panel)}
                    onChange={(shown) => togglePanel(panel, shown)}
                  />
                }
              />
            ))}
          </div>
        </div>

        <SettingRow
          label="Solidity"
          description="How much of the fight shows through the panels."
          control={<Opacity value={drawing.opacity} onChange={setOpacity} />}
        />

        <ul className="grid gap-2 border-t border-line-1 pt-4 text-xs text-text-muted">
          <li>
            {/* Not detected — claimed detection this app cannot actually perform would be
                worse than a plain instruction the player can follow. */}
            Set League to <span className="text-text">Borderless</span> in its video settings.
            Windows does not draw anything over a game in exclusive full screen, and no application
            can change that.
          </li>
          <li>It never takes focus, so your keyboard and mouse stay with the game.</li>
          <li>It shows the same reading as the main window, and nothing the game has hidden.</li>
        </ul>
      </div>
    </HudPanel>
  );
}

const PANEL_LABELS: Record<OverlayPanel, string> = {
  performance: "This game",
  matchup: "This lane",
  build: "Build",
  timeline: "So far",
};

const PANEL_NOTES: Record<OverlayPanel, string> = {
  performance: "Your four numbers against your own average.",
  matchup: "How the lane goes, on this patch and for you.",
  build: "Skill order and what to buy next.",
  timeline: "Kills, turrets and objectives that have already happened.",
};

function Unavailable(): React.ReactElement {
  return <span className="font-mono text-[11px] uppercase tracking-label text-text-faint">—</span>;
}

/**
 * The current shortcut, and a way to press a new one.
 *
 * Capturing rather than typing: the accelerator syntax is the core's, and asking a player to
 * write `Control+Alt+L` is asking them to learn it. While it is listening every key press is
 * swallowed, including the ones the browser would otherwise act on — a player pressing
 * Ctrl+R to bind it should not reload the window.
 *
 * Escape leaves without changing anything, and is the only key that does. It is also the one
 * key that cannot be bound, which is a fair trade for always having a way out.
 */
function ShortcutField({
  current,
  onChange,
}: {
  current: string;
  onChange: (accelerator: string) => Promise<void>;
}): React.ReactElement {
  const [listening, setListening] = useState(false);

  const capture = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setListening(false);
        return;
      }

      const press: KeyPress = {
        code: event.code,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
      };
      const chosen = accelerator(press);
      // A press that is not a combination yet — modifiers alone, or a key this cannot name —
      // leaves it listening. The player is still choosing.
      if (!chosen) return;

      setListening(false);
      void onChange(chosen);
    },
    [onChange]
  );

  useEffect(() => {
    if (!listening) return;
    // Capture phase, on the window: this has to see the key before anything else decides to
    // act on it.
    globalThis.addEventListener?.("keydown", capture, true);
    return () => globalThis.removeEventListener?.("keydown", capture, true);
  }, [listening, capture]);

  return (
    <button
      type="button"
      onClick={() => setListening((on) => !on)}
      aria-label={
        listening
          ? "Press a combination, or Escape to cancel"
          : `Change the shortcut, currently ${readableShortcut(current)}`
      }
      className={cn(
        "notch-sm cursor-pointer border px-3 py-1.5 font-mono text-xs transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        listening
          ? "border-accent bg-surface-2 text-accent"
          : "border-line-2 bg-surface-dark text-text hover:bg-surface-2"
      )}
    >
      {listening ? "Press a combination…" : readableShortcut(current)}
    </button>
  );
}

/**
 * Which screen the overlay is on.
 *
 * A screen the operating system does not name cannot be chosen: the setting is stored as a
 * name, so there would be nothing to write down. It is drawn and disabled rather than left
 * out, because a monitor missing from a list of monitors reads as a bug.
 */
function ScreenPicker({
  monitors,
  chosen,
  onChange,
}: {
  monitors: MonitorInfo[];
  chosen: string | null;
  onChange: (monitor: string | null) => void;
}): React.ReactElement {
  return (
    <select
      aria-label="Which screen the overlay is on"
      value={chosen ?? ""}
      onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
      className={cn(
        "notch-sm max-w-[15rem] cursor-pointer border border-line-2 bg-surface-dark px-2 py-1.5 text-xs text-text",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      )}
    >
      <option value="">Wherever the window already is</option>
      {monitors.map((monitor, index) => (
        <option
          // The name is the identity everywhere else, so it is the key wherever there is one.
          key={monitor.name ?? `unnamed-${index}`}
          value={monitor.name ?? ""}
          disabled={!monitor.name}
        >
          {monitor.name ?? "An unnamed screen"} · {monitor.width}×{monitor.height}
          {monitor.primary ? " · main" : ""}
        </option>
      ))}
    </select>
  );
}

const CORNERS: readonly { value: Corner; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

function CornerPicker({
  chosen,
  onChange,
}: {
  chosen: Corner;
  onChange: (corner: Corner) => void;
}): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label="Which corner the overlay sits in"
      className="mt-3 grid grid-cols-2 gap-px bg-line-1"
    >
      {CORNERS.map((corner) => {
        const active = corner.value === chosen;
        return (
          <button
            key={corner.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(corner.value)}
            className={cn(
              "cursor-pointer px-2 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-150",
              "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
              active
                ? "bg-accent/15 text-accent"
                : "bg-surface-dark text-text-muted hover:bg-white/5 hover:text-text"
            )}
          >
            {corner.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * How far in from the corner, in pixels.
 *
 * Committed on blur rather than on every keystroke: each change moves a window and writes a
 * file, and a player typing "120" should not have the overlay walk across the screen through
 * 1, 12 and then 120.
 */
function Margins({
  dx,
  dy,
  onChange,
}: {
  dx: number;
  dy: number;
  onChange: (dx: number, dy: number) => void;
}): React.ReactElement {
  return (
    <div className="mt-3 flex items-end gap-3">
      <Margin label="Across" value={dx} onCommit={(next) => onChange(next, dy)} />
      <Margin label="Down" value={dy} onCommit={(next) => onChange(dx, next)} />
    </div>
  );
}

function Margin({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}): React.ReactElement {
  const [draft, setDraft] = useState(String(value));

  // The core clamps an offset that would push the window off its own screen, so what comes
  // back is not always what was typed. Following it keeps the field showing what is true.
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (): void => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraft(String(value));
      return;
    }
    onCommit(parsed);
  };

  return (
    <label className="grid gap-1">
      <span className="hud-label">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={cn(
          "notch-sm w-20 border border-line-2 bg-surface-dark px-2 py-1.5 font-mono text-xs text-text",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        )}
      />
    </label>
  );
}

function Opacity({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}): React.ReactElement {
  const percent = Math.round(value * 100);

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        aria-label="How solid the overlay's panels are"
        min={MIN_OPACITY}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-32 cursor-pointer accent-accent"
      />
      {/* Tabular width so the number does not shift the slider as it changes. */}
      <span className="w-10 text-right font-mono text-xs tabular-nums text-text-muted">
        {percent}%
      </span>
    </div>
  );
}
