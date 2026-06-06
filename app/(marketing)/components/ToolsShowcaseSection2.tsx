const DDR_V2 = "15.14.1";
const sq2 = (n: string) => `https://ddragon.leagueoflegends.com/cdn/${DDR_V2}/img/champion/${n}.png`;

const DRAFT: Record<string, string[]> = {
  "Blue Team": ["Malphite", "Hecarim", "Orianna", "Jinx", "Thresh"],
  "Red Team": ["Darius", "Vi", "Yasuo", "Caitlyn", "Lulu"],
};

function WindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-2xl">
      <div className="flex h-8 items-center gap-1.5 rounded-t-xl border-b border-border bg-surface-2 px-3">
        <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-text-muted">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DraftAnalyzerMockup() {
  return (
    <WindowChrome title="LoL AI Coach · Draft Analyzer">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(["Blue Team", "Red Team"] as const).map((team) => (
            <div key={team} className="space-y-1">
              <p className={`text-[10px] font-bold ${team === "Blue Team" ? "text-blue-400" : "text-danger"}`}>{team}</p>
              {(DRAFT[team] ?? []).map((champ) => (
                <div key={champ} className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1">
                  <img src={sq2(champ)} alt={champ} className="h-5 w-5 rounded object-cover" />
                  <span className="text-[10px] text-text-muted">{champ}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {([
            ["Engage", 7, 5],
            ["Teamfight", 8, 9],
          ] as [string, number, number][]).map(([label, blue, red]) => (
            <div key={label} className="rounded-md bg-surface-2 p-2">
              <div className="mb-1 flex items-center justify-between text-[9px] text-text-muted">
                <span>{label}</span>
                <span className="text-blue-400">{blue}</span>
                <span className="text-danger">{red}</span>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-1.5 rounded-full bg-blue-400/60"
                    style={{ width: `${(blue / 10) * 100}%` }}
                  />
                </div>
                <div className="flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-1.5 rounded-full bg-danger/60"
                    style={{ width: `${(red / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-warning">Verdict</p>
          <p className="text-[11px] leading-relaxed text-text-muted">
            Red team outscales in late game teamfights. Blue must end before 30 minutes.
          </p>
        </div>
      </div>
    </WindowChrome>
  );
}

function BuildExplanationMockup() {
  return (
    <WindowChrome title="LoL AI Coach · Build Explanation">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-success/20 bg-success/5 px-3 py-2">
          <div>
            <p className="text-xs font-bold text-text">Yasuo · Mid</p>
            <p className="text-[10px] text-text-muted">9/2/8 · 28 min</p>
          </div>
          <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">Victory</span>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-[11px] font-semibold text-accent">
          Bu Buildi AI ile Analiz Et ▾
        </div>
        <div className="space-y-2">
          {([
            ["Trinity Force", true, "Perfect for split push + extended trades"],
            ["Immortal Shieldbow", true, "Lifeline passive saved you twice in teamfights"],
            ["Void Staff", false, "Better replaced with Mortal Reminder — enemy Soraka is the heal threat"],
          ] as [string, boolean, string][]).map(([item, ok, note]) => (
            <div key={item} className="rounded-md border border-border bg-surface-2 p-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-surface" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold ${ok ? "text-text" : "text-text"}`}>{item}</span>
                    <span className={`text-[11px] font-bold ${ok ? "text-success" : "text-danger"}`}>
                      {ok ? "✓" : "✗"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-text-muted">{note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WindowChrome>
  );
}

interface Tool {
  title: string;
  description: string;
  mockup: React.ReactNode;
}

const TOOLS: Tool[] = [
  {
    title: "Draft Analyzer",
    description:
      "Input any 10-champion draft and get a full composition breakdown: team strengths, win conditions, scaling profiles, key matchups, and risks for both sides.",
    mockup: <DraftAnalyzerMockup />,
  },
  {
    title: "Build Explanation",
    description:
      "Every item in your last game, explained. Was that Ravenous Hydra the right call? What should you have built instead? Get honest item-by-item coaching from AI that watched every fight.",
    mockup: <BuildExplanationMockup />,
  },
];

export function ToolsShowcaseSection2() {
  return (
    <section className="py-4">
      <div className="mx-auto max-w-7xl px-6">
        <div className="space-y-20">
          {TOOLS.map(({ title, description, mockup }, index) => {
            const isEven = index % 2 !== 0;
            return (
              <div
                key={title}
                className={`grid items-center gap-12 md:grid-cols-2 ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    AI Tool
                  </div>
                  <h3 className="font-display text-2xl font-bold text-text md:text-3xl">{title}</h3>
                  <p className="text-base leading-relaxed text-text-muted">{description}</p>
                </div>
                <div className="mx-auto w-full max-w-sm md:max-w-none">{mockup}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
