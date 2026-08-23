"use client";

interface MatchStoryControlsProps {
  minute: number;
  duration: number;
  playing: boolean;
  speed: number;
  onSeek: (minute: number) => void;
  onStepEvent: (direction: -1 | 1) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
}

export const PLAYBACK_SPEEDS = [1, 2, 4] as const;

const BUTTON =
  "notch-sm grid h-[30px] w-[30px] shrink-0 place-items-center border border-line-2 bg-ink-700 text-fg-2 transition-colors hover:border-line-3 hover:text-fg-1";

/**
 * The transport. Dragging is for hunting a moment, play is for watching it unfold, and the step
 * buttons jump to the previous or next minute that actually holds an event — which is what someone
 * reviewing a game reaches for, since most minutes hold nothing at all.
 *
 * The scrubber is a real `<input type="range">`, so arrows, Home and End work without a line of
 * code here. Rebuilding it out of divs to control its look would cost all of that.
 */
export function MatchStoryControls({
  minute,
  duration,
  playing,
  speed,
  onSeek,
  onStepEvent,
  onTogglePlay,
  onSpeedChange,
}: MatchStoryControlsProps): React.JSX.Element {
  return (
    <div
      // Wraps rather than overflowing: at phone width the three buttons, the scrubber, the readout
      // and the speed select together exceed the panel, and an unwrapped row pushes the select
      // clean off the right edge where it cannot be reached at all.
      className="flex flex-wrap items-center gap-2.5 px-5 pb-4 pt-2.5"
      onKeyDown={(e) => {
        // Space is play/pause anywhere in the transport, but not when it would swallow the
        // activation of the button the reader has actually focused.
        if (e.code !== "Space" || e.target !== e.currentTarget) return;
        e.preventDefault();
        onTogglePlay();
      }}
    >
      <button
        type="button"
        className={BUTTON}
        onClick={() => onStepEvent(-1)}
        aria-label="Jump to the previous event"
      >
        ⏮
      </button>
      <button
        type="button"
        className={`${BUTTON} border-acid-500 text-acid-500`}
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <button
        type="button"
        className={BUTTON}
        onClick={() => onStepEvent(1)}
        aria-label="Jump to the next event"
      >
        ⏭
      </button>

      <input
        type="range"
        min={0}
        max={duration}
        step={1}
        value={minute}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Match minute"
        aria-valuetext={`Minute ${minute} of ${duration}`}
        className="story-scrubber h-[30px] min-w-[140px] flex-1 cursor-pointer appearance-none bg-transparent"
      />

      <span className="shrink-0 whitespace-nowrap font-mono text-[11px] text-fg-2">
        {minute} / {duration}m
      </span>

      <select
        value={speed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        aria-label="Playback speed"
        className="border border-line-2 bg-ink-700 px-1 py-1.5 font-mono text-[10.5px] text-fg-2"
      >
        {PLAYBACK_SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
    </div>
  );
}
