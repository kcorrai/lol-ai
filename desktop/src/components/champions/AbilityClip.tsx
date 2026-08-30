import { useCallback, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ChampionSplash } from "@/components/hud/Splash";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

/**
 * Riot's own preview clip for one ability, played on a loop.
 *
 * The clip is the reason this panel is worth the room. A cooldown is a number a player can
 * read anywhere; what they cannot get from a table is what the thing *looks like* two
 * seconds before it kills them, and that is the one question a companion open beside a game
 * is well placed to answer.
 *
 * It is the only remote media this window plays, and the content policy names that one host
 * and nothing else. Everything about the failure path assumes it will sometimes not arrive:
 * a companion has to open while the player's connection is busy carrying a game.
 */
export function AbilityClip({
  videoUrl,
  /** Drawn under the clip and shown instead of it when the clip does not arrive. */
  champion,
  label,
}: {
  videoUrl: string;
  champion: string;
  /** What the clip is of, for anyone who cannot see it. */
  label: string;
}): React.ReactElement {
  const video = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const reduced = usePrefersReducedMotion();

  // A ref callback rather than an effect: the element is remounted on every ability change
  // (the `key` below), so this runs exactly when there is a new element to configure and
  // never on a render that did not produce one.
  const attach = useCallback(
    (element: HTMLVideoElement | null) => {
      video.current = element;
      if (element) element.playbackRate = slow ? 0.5 : 1;
    },
    [slow]
  );

  const replay = (): void => {
    const element = video.current;
    if (!element) return;
    element.currentTime = 0;
    void element.play().catch(() => undefined);
  };

  const toggleSlow = (): void => {
    setSlow((was) => {
      const next = !was;
      if (video.current) video.current.playbackRate = next ? 0.5 : 1;
      return next;
    });
  };

  return (
    <div className="relative border-b border-line-1 bg-surface-dark md:border-b-0 md:border-r">
      {failed ? (
        <div className="relative aspect-video overflow-hidden">
          <ChampionSplash champion={champion} opacity={0.55} position="46% 18%" />
          <span className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent" />
          <p className="absolute inset-x-3 bottom-3 font-mono text-[9.5px] uppercase tracking-label text-text-muted">
            Clip unavailable · the note beside it still applies
          </p>
        </div>
      ) : (
        <video
          // Remounted per ability. Swapping `src` on a live element needs an imperative
          // `load()` and leaves the previous frame on screen until the new one decodes.
          key={videoUrl}
          ref={attach}
          src={videoUrl}
          aria-label={label}
          loop
          muted
          playsInline
          // Not under reduced motion: a looping clip is exactly the movement the preference
          // is about, and it is the one thing on this screen the stylesheet cannot stop.
          autoPlay={!reduced}
          preload="auto"
          onError={() => setFailed(true)}
          className="block aspect-video w-full min-w-0 bg-surface-dark object-cover"
        />
      )}

      <div className="absolute bottom-3 right-3 flex gap-1.5">
        <ClipButton onClick={replay} label="Replay">
          <RotateCcw aria-hidden className="h-3.5 w-3.5" />
        </ClipButton>
        <ClipButton onClick={toggleSlow} label="Half speed" active={slow}>
          <span className="font-mono text-[10px] font-bold">½×</span>
        </ClipButton>
      </div>
    </div>
  );
}

function ClipButton({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid h-7 w-7 cursor-pointer place-items-center border transition-colors duration-150",
        active
          ? "border-accent bg-accent text-ink-1000"
          : "border-line-2 bg-ink-1000/80 text-text-body hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
