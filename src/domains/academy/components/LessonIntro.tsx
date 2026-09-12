import { Check } from "lucide-react";

interface LessonIntroProps {
  /** The HUD line above the title — where the lesson sits, or whose champion it is about. */
  eyebrow: string;
  title: string;
  summary: string;
  objectives: readonly string[];
}

/**
 * The top of a lesson: what it is, and what the reader will be able to do at the end of it.
 *
 * The objectives panel is the promise the rest of the page has to keep, so it is stated once,
 * up front, before any of the teaching starts.
 */
export function LessonIntro({
  eyebrow,
  title,
  summary,
  objectives,
}: LessonIntroProps): React.ReactElement {
  return (
    <>
      <header className="animate-hud-enter">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3.5 max-w-[24ch] font-display text-[30px] font-black uppercase leading-[1.02] tracking-[0.02em] text-text md:text-[40px]">
          {title}
        </h1>
        <p className="mt-3.5 max-w-[62ch] text-[15.5px] leading-relaxed text-text-body">
          {summary}
        </p>
      </header>

      <div className="notch mt-[18px] animate-hud-enter border border-border bg-surface px-5 py-[18px] [animation-delay:60ms]">
        <p className="hud-label text-text-faint">{"// What you will be able to do"}</p>
        <ul className="mt-3 grid gap-2.5">
          {objectives.map((objective) => (
            <li key={objective} className="grid grid-cols-[15px_1fr] items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
              <span className="text-[14px] leading-relaxed text-text-body">{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
