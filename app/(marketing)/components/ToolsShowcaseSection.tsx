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

const DDR_V = "15.14.1";
const sq = (n: string) => `https://ddragon.leagueoflegends.com/cdn/${DDR_V}/img/champion/${n}.png`;
const sp = (n: string) => `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${n}_0.jpg`;

function CounterPickMockup() {
  const counters: [string, string, string, string, string][] = [
    ["Malphite", "Malphite", "S", "EASY", "bg-success/20 text-success border-success/30"],
    ["Renekton", "Renekton", "A", "MED", "bg-accent/20 text-accent border-accent/30"],
    ["Pantheon", "Pantheon", "A", "EASY", "bg-accent/20 text-accent border-accent/30"],
  ];
  return (
    <WindowChrome title="LoL AI Coach · Counter Pick Generator">
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
          <img src={sq("Yasuo")} alt="Yasuo" className="h-7 w-7 rounded-md object-cover" />
          <span className="text-sm font-semibold text-text">Yasuo</span>
          <span className="text-text-muted">·</span>
          <span className="text-sm text-text-muted">Mid</span>
          <span className="ml-auto text-[10px] text-text-muted">Champion selected</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {counters.map(([name, key, tier, diff, cls]) => (
            <div key={name} className="rounded-lg border border-border bg-surface-2 p-2 text-center">
              <img src={sq(key)} alt={name} className="mx-auto mb-1.5 h-10 w-10 rounded-lg object-cover ring-1 ring-border" />
              <p className="text-xs font-semibold text-text">{name}</p>
              <div className={`mt-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${cls}`}>
                {tier} {diff}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-2.5">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-teal-400">AI Tip</p>
          <p className="text-[11px] leading-relaxed text-text-muted">
            Wind Wall blocks projectile counters — trade when it&apos;s on cooldown
          </p>
        </div>
      </div>
    </WindowChrome>
  );
}

function MatchupCoachMockup() {
  return (
    <WindowChrome title="LoL AI Coach · Matchup Coach">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={sq("Yasuo")} alt="Yasuo" className="h-8 w-8 rounded-lg object-cover ring-1 ring-border" />
            <span className="text-xs font-bold text-text-muted">vs</span>
            <img src={sq("Zed")} alt="Zed" className="h-8 w-8 rounded-lg object-cover ring-1 ring-border" />
            <div>
              <p className="text-xs font-bold text-text">Yasuo vs Zed · Mid</p>
              <p className="text-[10px] text-text-muted">12,400 games</p>
            </div>
          </div>
          <div className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-text-muted">
            EVEN
          </div>
        </div>
        <div className="flex gap-1">
          {(["Lane", "Trade", "Build", "Mistakes"] as const).map((tab) => (
            <div
              key={tab}
              className={`rounded-md px-2 py-1 text-[10px] font-medium ${tab === "Lane" ? "bg-accent/10 text-accent" : "text-text-muted"}`}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-[11px] leading-relaxed text-text-muted">
            Level 6 all-in window is your strongest point. Zed has no reliable escape after ult —
            flash-Q to win the trade.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([["Win Rate", "52.4%", "text-success"], ["Avg Kills", "6.2", "text-text"]] as [string, string, string][]).map(
            ([label, value, cls]) => (
              <div key={label} className="rounded-lg border border-border bg-surface-2 p-2">
                <p className={`text-sm font-bold ${cls}`}>{value}</p>
                <p className="text-[10px] text-text-muted">{label}</p>
              </div>
            )
          )}
        </div>
      </div>
    </WindowChrome>
  );
}

function OtpAssistantMockup() {
  return (
    <WindowChrome title="LoL AI Coach · OTP Assistant">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <img src={sq("Yasuo")} alt="Yasuo" className="h-10 w-10 rounded-xl object-cover ring-2 ring-accent/40" />
          <div>
            <p className="text-sm font-bold text-text">Yasuo OTP · Mid</p>
            <p className="text-[10px] text-text-muted">One-Trick Playbook</p>
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-text-muted">Meta Rating</span>
            <span className="font-bold text-success">7/10</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full w-[70%] rounded-full bg-success/60" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-semibold">
          <div className="rounded-md border border-success/30 bg-success/10 p-1.5">
            <p className="mb-1 text-[8px] text-success">KOLAY</p>
            {["Garen", "Malphite", "Nasus"].map((c) => (
              <p key={c} className="text-text-muted">{c}</p>
            ))}
          </div>
          <div className="rounded-md border border-warning/30 bg-warning/10 p-1.5">
            <p className="mb-1 text-[8px] text-warning">ORTA</p>
            {["Darius", "Camille"].map((c) => (
              <p key={c} className="text-text-muted">{c}</p>
            ))}
          </div>
          <div className="rounded-md border border-danger/30 bg-danger/10 p-1.5">
            <p className="mb-1 text-[8px] text-danger">ZOR</p>
            {["Fiora", "Irelia"].map((c) => (
              <p key={c} className="text-text-muted">{c}</p>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Gizli Mekanik</p>
            <span className="rounded-full bg-accent px-1 py-0.5 text-[8px] font-bold text-background">PRO</span>
          </div>
          <p className="text-[10px] text-text-muted">E-cancel into Q for extended knockup window</p>
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
    title: "Counter Pick Generator",
    description:
      "Pick the right champion before you load into game. Get AI-curated counter picks with tier ratings, difficulty scores, and the one tip that actually matters in that matchup.",
    mockup: <CounterPickMockup />,
  },
  {
    title: "Matchup Coach",
    description:
      "Deep-dive any lane matchup: wave management, trade patterns, build paths, and the critical mistakes most players make. Based on real high-elo data, not wiki theory-crafting.",
    mockup: <MatchupCoachMockup />,
  },
  {
    title: "OTP Assistant",
    description:
      "Built for one-tricks. Get the full OTP playbook: matchup tier list, ban priorities, hidden mechanics, power spikes, and meta rating — all from an AI that’s studied hundreds of high-elo Yasuo games.",
    mockup: <OtpAssistantMockup />,
  },
];

export function ToolsShowcaseSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            5 AI-Powered Tools. One Platform.
          </h2>
          <p className="mt-3 text-text-muted">
            From pre-game draft to post-game build review — every phase of your League game covered.
          </p>
        </div>

        <div className="space-y-20">
          {TOOLS.map(({ title, description, mockup }, index) => {
            const isEven = index % 2 === 0;
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
