import { HudStagger, HudStaggerItem } from "./motion";

interface Step {
  n: string;
  title: string;
  detail: string;
}

const STEPS: readonly Step[] = [
  { n: "01", title: "Paste your Riot ID", detail: "Read-only. No password." },
  // Ten, matching what the preview actually slices
  // (src/domains/riot/services/previewService.ts:18).
  { n: "02", title: "10 games parsed", detail: "Full timelines. ~90 seconds." },
  { n: "03", title: "Fix one habit", detail: "Tracked over your next three games." },
];

// A 1px grid gap over a line-colored ground draws the dividers, so the strip reads
// as one instrument panel split into three rather than three separate cards.
export function HowItWorksStrip(): React.ReactElement {
  return (
    <section className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <HudStagger className="mx-auto grid max-w-[1240px] grid-cols-1 gap-px border border-border bg-line-1 md:grid-cols-3">
        {STEPS.map((s) => (
          <HudStaggerItem key={s.n} className="h-full">
            <div className="flex h-full items-baseline gap-3 bg-background px-5 py-5">
              <span className="font-mono text-xs text-accent">{s.n}</span>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.05em] text-text">
                  {s.title}
                </p>
                <p className="mt-1.5 text-[13px] text-text-muted">{s.detail}</p>
              </div>
            </div>
          </HudStaggerItem>
        ))}
      </HudStagger>
    </section>
  );
}
