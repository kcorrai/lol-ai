import { useEffect, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { Confetti } from "./Confetti";
import type { SpotRect } from "./SpotlightOverlay";
import type { TourStep } from "./tourSteps";

const BUBBLE_W = 320;
const GAP = 16;

// Anchors the speech bubble next to the spotlighted rect (or centers it for target-less steps),
// clamped inside the viewport. Returns inline style + a transform for the chosen placement.
function bubbleStyle(rect: SpotRect | null, placement: TourStep["placement"]): React.CSSProperties {
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

interface CoachMascotProps {
  step: TourStep;
  rect: SpotRect | null;
  index: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function CoachMascot({ step, rect, index, total, onNext, onBack, onSkip }: CoachMascotProps): React.JSX.Element {
  const [typed, setTyped] = useState("");

  // Typewriter — reveal the body one char at a time, reset whenever the step changes.
  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(step.body.slice(0, i));
      if (i >= step.body.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [step.body]);

  const isLast = index === total - 1;

  return (
    <div
      className="pointer-events-auto absolute w-80 rounded-2xl border border-accent/30 bg-surface p-4 shadow-2xl"
      style={bubbleStyle(rect, step.placement)}
    >
      {step.celebrate && <Confetti />}

      <button onClick={onSkip} aria-label="Skip tour" className="absolute right-2.5 top-2.5 rounded-md p-1 text-text-muted/60 transition-colors hover:text-text">
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex items-start gap-3">
        {/* Coach avatar — gold, bouncing, with a blinking visor */}
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

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-accent" : "w-1.5 bg-surface-2"}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {index > 0 && !isLast && (
            <button onClick={onBack} aria-label="Back" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          {isLast && step.cta ? (
            <Link href={step.cta.href} onClick={onNext} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
              {step.cta.label}
            </Link>
          ) : (
            <button onClick={onNext} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
              {index === 0 ? "Show me" : "Next"} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
