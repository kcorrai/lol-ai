import Image from "next/image";

function WindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface"
      style={{ boxShadow: "0 0 48px rgba(88,70,180,0.1), 0 20px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
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

// ── Counter Pick ─────────────────────────────────────────────────────────────

const COUNTER_TABS: { name: string; key: string; tier: string; wr: string; active: boolean }[] = [
  { name: "Malphite", key: "Malphite", tier: "S", wr: "54.1%", active: true },
  { name: "Pantheon", key: "Pantheon", tier: "A", wr: "51.8%", active: false },
  { name: "Renekton", key: "Renekton", tier: "A", wr: "50.6%", active: false },
];

const LANE_PHASES: { label: string; val: string; cls: string }[] = [
  { label: "Early", val: "Weak", cls: "text-danger bg-danger/10 border-danger/20" },
  { label: "Mid", val: "Strong", cls: "text-warning bg-warning/10 border-warning/20" },
  { label: "Late", val: "Dominant", cls: "text-success bg-success/10 border-success/20" },
];

function CounterPickMockup() {
  return (
    <WindowChrome title="LoL AI Coach · Counter Pick Generator">
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
          <Image src={sq("Yasuo")} alt="Yasuo" width={28} height={28} className="rounded-md object-cover" />
          <span className="text-sm font-semibold text-text">Yasuo · Mid</span>
          <span className="ml-auto text-[9px] text-text-muted">15,240 games · Patch 15.14</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {COUNTER_TABS.map(({ name, key, tier, wr, active }) => (
            <div key={name} className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-opacity ${active ? "border-success/40 bg-success/10" : "border-border bg-surface-2 opacity-50"}`}>
              <Image src={sq(key)} alt={name} width={32} height={32} className="rounded-lg object-cover ring-1 ring-border" />
              <p className="text-[10px] font-semibold text-text">{name}</p>
              <span className="text-[8px] text-text-muted">{tier} · {wr}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-lg border border-success/20 bg-success/5 p-3">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[8px] font-bold uppercase text-text-muted">Lane</span>
            {LANE_PHASES.map(({ label, val, cls }) => (
              <span key={label} className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${cls}`}>{label}: {val}</span>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-text-muted">
            Malphite Q resets Yasuo passive shield on every cast. R engage bypasses Wind Wall entirely — Yasuo has no counterplay to the engage angle.
          </p>
          <div className="rounded-md border border-warning/20 bg-warning/5 px-2 py-1.5">
            <span className="text-[8px] font-bold text-warning">⚠ WATCH OUT  </span>
            <span className="text-[10px] text-text-muted">Yasuo E-dashes through you to escape — position to cut off his routes before engaging</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {["Force lv1-2 trades", "Rush Armor first back", "Stack Resolve"].map((wc) => (
              <span key={wc} className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[8px] text-success">{wc}</span>
            ))}
          </div>
          <div className="flex items-center justify-between text-[9px] text-text-muted">
            <span>Core items: <span className="text-text">Sunfire Aegis · Thornmail</span></span>
            <span className="text-accent">Grasp · Resolve</span>
          </div>
        </div>

        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-2.5">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-teal-400">AI Tip</p>
          <p className="text-[11px] leading-relaxed text-text-muted">
            Wait for Malphite to waste Q before trading — his shield recharge is your only safe engagement window. Punish it every time.
          </p>
        </div>
      </div>
    </WindowChrome>
  );
}

// ── Matchup Coach ─────────────────────────────────────────────────────────────

const POWER_SPIKES: { trigger: string; desc: string }[] = [
  { trigger: "Level 3", desc: "Q at 2 stacks + E dash = guaranteed tornado every trade" },
  { trigger: "Trinity Force", desc: "Extended fights become lethal — never short-trade after this item" },
];

function MatchupCoachMockup() {
  return (
    <WindowChrome title="LoL AI Coach · Matchup Coach">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Image src={sq("Yasuo")} alt="Yasuo" width={32} height={32} className="rounded-lg object-cover ring-1 ring-border" />
            <span className="text-[10px] font-bold text-text-muted">vs</span>
            <Image src={sq("Zed")} alt="Zed" width={32} height={32} className="rounded-lg object-cover ring-1 ring-border" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text">Yasuo vs Zed · Mid</p>
            <p className="text-[10px] text-text-muted">12,400 games · Patch 15.14</p>
          </div>
          <span className="shrink-0 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[9px] font-bold text-danger">UNFAVORABLE</span>
        </div>

        <div className="flex gap-1">
          {["Lane", "Trades", "Build", "Mistakes"].map((tab) => (
            <div key={tab} className={`rounded-md px-2 py-1 text-[10px] font-medium ${tab === "Lane" ? "bg-accent/10 text-accent" : "text-text-muted"}`}>{tab}</div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-surface-2 p-2.5">
            <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-text-muted">Levels 1–3</p>
            <p className="text-[10px] leading-relaxed text-text-muted">Play safe. Zed outranges you before level 3. Don&apos;t trade until his W shadow expires — it doubles his burst damage.</p>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent/5 p-2.5">
            <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-accent">Level 6 Plan</p>
            <p className="text-[10px] leading-relaxed text-text-muted">
              All-in when Zed R is mid-animation — step out of his shadow, then E-Q back into him. His full combo is 70% your HP; your full combo is 100% of his.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-2.5">
            <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wider text-text-muted">Power Spikes</p>
            <div className="space-y-1.5">
              {POWER_SPIKES.map(({ trigger, desc }) => (
                <div key={trigger} className="flex items-baseline gap-2">
                  <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[8px] font-bold text-accent">{trigger}</span>
                  <span className="text-[10px] text-text-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border bg-surface-2 p-2">
              <p className="mb-0.5 text-[8px] font-bold text-success">WAVE CONTROL</p>
              <p className="text-[9px] text-text-muted">Freeze under tower when ahead — forces Zed into bad angles</p>
            </div>
            <div className="rounded-md border border-border bg-surface-2 p-2">
              <p className="mb-0.5 text-[8px] font-bold text-warning">WARDING TIP</p>
              <p className="text-[9px] text-text-muted">Ward river at 3:00 — Zed players love early roam kills</p>
            </div>
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}

// ── OTP Assistant ─────────────────────────────────────────────────────────────

const HIDDEN_MECHANICS: string[] = [
  "E-cancel resets Q tornado timer at max dash range",
  "W can block Darius Q healing on specific tick frames",
  "Dash through dying minions to chain E across the wave",
];

const BAN_PRIORITY: { rank: string; name: string; reason: string }[] = [
  { rank: "#1", name: "Malphite", reason: "R cancels your entire combo" },
  { rank: "#2", name: "Wukong", reason: "Clone disrupts E target lock" },
];

const MATCHUP_ROWS: { tier: string; names: string; cls: string }[] = [
  { tier: "EASY", names: "Garen · Nasus · Morde", cls: "text-success" },
  { tier: "MED", names: "Darius · Camille · Riven", cls: "text-warning" },
  { tier: "HARD", names: "Fiora · Irelia · Malphite", cls: "text-danger" },
];

function OtpAssistantMockup() {
  return (
    <WindowChrome title="LoL AI Coach · OTP Assistant">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Image src={sq("Yasuo")} alt="Yasuo" width={40} height={40} className="rounded-xl object-cover ring-2 ring-accent/40" />
          <div className="flex-1">
            <p className="text-sm font-bold text-text">Yasuo OTP · Mid</p>
            <p className="text-[10px] text-text-muted">One-Trick Playbook</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-success">7.4<span className="text-xs text-text-muted">/10</span></p>
            <p className="text-[9px] text-text-muted">Meta Rating</p>
          </div>
        </div>

        <div className="rounded-lg border border-success/20 bg-success/5 p-2.5">
          <p className="text-[10px] font-semibold text-success">Solid meta pick — Patch 15.14</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">Trinity Force buff extends kill threat window. Bruiser build outperforms glass cannon this patch — lean into extended trades.</p>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-2.5">
          <p className="mb-1.5 text-[8px] font-bold uppercase tracking-wider text-text-muted">Power Spikes</p>
          <div className="space-y-1.5">
            {[{ trigger: "Level 3", desc: "Q 2-stack + E dash = full tornado combo every fight" }, { trigger: "Trinity Force", desc: "Extended trades become win conditions — never kite away after this" }].map(({ trigger, desc }) => (
              <div key={trigger} className="flex items-baseline gap-2">
                <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[8px] font-bold text-accent">{trigger}</span>
                <p className="text-[10px] text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider text-accent">Hidden Mechanics</p>
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[7px] font-bold text-background">PRO</span>
          </div>
          <div className="space-y-1">
            {HIDDEN_MECHANICS.map((m) => (
              <div key={m} className="flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 text-[10px] text-accent">→</span>
                <p className="text-[10px] text-text-muted">{m}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border bg-surface-2 p-2">
            <p className="mb-1 text-[8px] font-bold uppercase text-text-muted">Ban Priority</p>
            {BAN_PRIORITY.map(({ rank, name, reason }) => (
              <div key={name} className="flex items-center gap-1.5 py-0.5">
                <span className="text-[8px] font-bold text-danger">{rank}</span>
                <span className="text-[9px] font-semibold text-text">{name}</span>
                <span className="ml-auto truncate text-[8px] text-text-muted">{reason}</span>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-border bg-surface-2 p-2">
            <p className="mb-1 text-[8px] font-bold uppercase text-text-muted">Matchup Tiers</p>
            {MATCHUP_ROWS.map(({ tier, names, cls }) => (
              <div key={tier} className="flex items-center gap-1.5 py-0.5">
                <span className={`shrink-0 text-[8px] font-bold ${cls}`}>{tier}</span>
                <span className="truncate text-[9px] text-text-muted">{names}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

interface Tool {
  title: string;
  description: string;
  mockup: React.ReactNode;
}

const TOOLS: Tool[] = [
  {
    title: "Counter Pick Generator",
    description:
      "Pick the right champion before you load into game. Get AI-curated counter picks with lane phase breakdowns, watch-out tips, win conditions, and the exact rune setup — not just a tier list.",
    mockup: <CounterPickMockup />,
  },
  {
    title: "Matchup Coach",
    description:
      "Deep-dive any lane matchup: level 1-3 gameplan, level 6 power spike, trade sequences, wave control and warding tips. Based on real high-elo data, not wiki theory-crafting.",
    mockup: <MatchupCoachMockup />,
  },
  {
    title: "OTP Assistant",
    description:
      "Built for one-tricks. Get the full OTP playbook: meta assessment per patch, power spike timings, hidden mechanics, ban priority with reasons, and a full matchup tier list.",
    mockup: <OtpAssistantMockup />,
  },
];

export function ToolsShowcaseSection() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-[#5846B4]/6 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">AI Tools</p>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            5 AI-Powered Tools.{" "}
            <span className="text-accent" style={{ textShadow: "0 0 30px rgba(200,155,60,0.3)" }}>One Platform.</span>
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
