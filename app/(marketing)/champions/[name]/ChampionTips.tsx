interface ChampionTipsProps {
  name: string;
  playing: string[];
  against: string[];
}

function TipList({ tips, tone }: { tips: string[]; tone: "accent" | "danger" }): React.ReactElement {
  return (
    <div className="grid gap-3">
      {tips.map((tip) => (
        <div key={tip} className="grid grid-cols-[14px_minmax(0,1fr)] items-start gap-2.5">
          <span
            aria-hidden
            className={`mt-[7px] h-1.5 w-1.5 ${tone === "accent" ? "bg-accent" : "bg-danger"}`}
          />
          <span className="text-[13.5px] text-text-body">{tip}</span>
        </div>
      ))}
    </div>
  );
}

/** Riot's own ally and enemy tips, split into the two questions a reader actually has. */
export function ChampionTips({
  name,
  playing,
  against,
}: ChampionTipsProps): React.ReactElement | null {
  if (playing.length === 0 && against.length === 0) return null;

  return (
    <section className="notch border border-border bg-surface">
      <div className="border-b border-line-1 px-5 py-3.5">
        <span className="hud-label text-[10.5px]">{"// Playing them · playing against them"}</span>
      </div>
      <div className="grid lg:grid-cols-2">
        {playing.length > 0 && (
          <div className="border-b border-line-1 px-5 py-4 lg:border-b-0 lg:border-r">
            <p className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent">
              As {name}
            </p>
            <TipList tips={playing} tone="accent" />
          </div>
        )}
        {against.length > 0 && (
          <div className="px-5 py-4">
            <p className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-danger">
              Against {name}
            </p>
            <TipList tips={against} tone="danger" />
          </div>
        )}
      </div>
    </section>
  );
}
