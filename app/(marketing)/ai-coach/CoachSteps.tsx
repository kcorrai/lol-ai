import { SectionHead } from "../components/laneiq/SectionHead";
import { HudStagger, HudStaggerItem } from "../components/laneiq/motion";

/**
 * What happens between pressing the button and reading the report.
 *
 * Each step is one stage of `src/domains/coaching/pipeline/`, not a marketing abstraction:
 * `dataPreparator.ts` gathers the games and the benchmark, `promptBuilder.ts` turns that into
 * the prompt, `coachingPipeline.ts` calls the model and refuses anything that will not parse.
 *
 * The third step says the model is asked for strict JSON and re-asked when it fails, which
 * reads like an implementation detail and is not one: it is the difference between a report
 * with graded sections and a paragraph of confident prose, and a player who has been sold
 * "AI coaching" before has good reason to want to know which of the two this is.
 */

interface Step {
  n: string;
  title: string;
  body: string;
}

const STEPS: readonly Step[] = [
  {
    n: "01",
    title: "It opens the games, not the scoreboard",
    body: "Your matches come out of the database with their timeline: when things happened, not only that they did. A post-game screen already told you the KDA — that number is the question, not the answer.",
  },
  {
    n: "02",
    title: "It grades them against your rank",
    body: "Your CS, gold and damage are put next to the benchmark for the tier you are actually in. Seven CS a minute is a good game in one division and a bad one in another, and a coach that does not know which is guessing.",
  },
  {
    n: "03",
    title: "It has to answer in a shape",
    body: "The model is given the prepared reading and asked for a strict schema — verdict, graded sections, numbered actions. A reply that will not parse is refused and asked again rather than shown to you as prose.",
  },
  {
    n: "04",
    title: "It keeps what it read",
    body: "The report is stored with the matches behind it, so every claim in it can be walked back to the games it came from — and so you can put this week next to last week.",
  },
];

export function CoachSteps(): React.ReactElement {
  return (
    <section className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="How the report is made" aside="Four stages, no magic" />

        <HudStagger className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <HudStaggerItem key={step.n}>
              <div className="notch h-full border border-border bg-surface p-5">
                <span className="font-mono text-[10.5px] text-accent">{step.n}</span>
                <p className="mt-2 font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
                  {step.title}
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-muted">{step.body}</p>
              </div>
            </HudStaggerItem>
          ))}
        </HudStagger>
      </div>
    </section>
  );
}
