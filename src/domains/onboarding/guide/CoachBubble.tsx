import { useEffect, useState } from "react";
import { Bot, ChevronRight, ArrowRight, X } from "lucide-react";
import { Confetti } from "./Confetti";
import type { SpotRect } from "./SpotlightOverlay";
import type { GuideStep } from "./guideSteps";

const BUBBLE_W = 340;
const GAP = 18;

// Anchors the coach bubble beside the lit rect (or centers it for target-less steps), clamped
// inside the viewport. Coordinates are viewport-relative (position: fixed).
function bubbleStyle(rect: SpotRect | null, placement: GuideStep["placement"]): React.CSSProperties {
  if (!rect || placement === "center") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const clampX = (x: number) => Math.max(BUBBLE_W / 2 + 12, Math.min(x, vw - BUBBLE_W / 2 - 12));

  switch (placement) {
    case "top":
      return { top: rect.top - GAP, left: clampX(cx), transform: "translate(-50%, -100%)" };
    case "left":
      return { top: cy, left: rect.left - GAP, transform: "translate(-100%, -50%)" };
    case "right":
      return { top: cy, left: rect.left + rect.width + GAP, transform: "translateY(-50%)" };
    case "bottom":
    default:
      return { top: rect.top + rect.height + GAP, left: clampX(cx), transform: "translateX(-50%)" };
  }
}

interface CoachBubbleProps {
  step: GuideStep;
  rect: SpotRect | null;
  index: number;
  total: number;
  /** Manual/final steps only — advance the journey. */
  onManualAdvance: () => void;
  /** Route steps — the "Take me there" safety valve. */
  onGoTo: (href: string) => void;
  /** Escape hatch — end the journey so a stuck user is never trapped. */
  onDismiss: () => void;
}

export function CoachBubble({ step, rect, index, total, onManualAdvance, onGoTo, onDismiss }: CoachBubbleProps): React.JSX.Element {
  const [typed, setTyped] = useState("");

  // Typewriter — reveal the body one char at a time; reset on every step change.
  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(step.body.slice(0, i));
      if (i >= step.body.length) window.clearInterval(id);
    }, 14);
    return () => window.clearInterval(id);
  }, [step.body]);

  const isManual = step.advance.type === "manual";
  const isRoute = step.advance.type === "route";

  return (
    <div
      className="pointer-events-auto fixed z-[81] rounded-2xl border border-accent/30 bg-surface p-4 shadow-2xl"
      style={{ width: BUBBLE_W, ...bubbleStyle(rect, step.placement) }}
    >
      {step.isFinal && <Confetti />}

      {/* Escape hatch — always available so an external-dependency step (connect / sync / AI) can
          never permanently trap the user. Hidden on the final celebratory step. */}
      {!step.isFinal && (
        <button
          onClick={onDismiss}
          className="absolute -right-1 -top-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-text-muted/60 transition-colors hover:text-text"
          title="Skip setup and go to the app"
        >
          Skip setup <X className="h-3 w-3" />
        </button>
      )}

      <div className="relative flex items-start gap-3">
        <div className="relative flex h-11 w-11 shrink-0 animate-coach-bounce items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/40">
          <Bot className="h-6 w-6 origin-center animate-blink" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold text-text">{step.title}</h3>
          <p className="mt-1 min-h-[3.5rem] text-sm leading-relaxed text-text-muted">
            {typed}
            <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-accent align-middle" />
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-accent" : i < index ? "w-1.5 bg-accent/50" : "w-1.5 bg-surface-2"}`} />
          ))}
        </div>

        {isManual ? (
          <button
            onClick={onManualAdvance}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {step.isFinal ? "Start climbing" : index === 0 ? "Let's go" : "Got it"}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : isRoute && step.goTo ? (
          <button
            onClick={() => onGoTo(step.goTo as string)}
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
          >
            Take me there <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="text-xs font-medium text-text-muted/70">Waiting for you…</span>
        )}
      </div>
    </div>
  );
}
