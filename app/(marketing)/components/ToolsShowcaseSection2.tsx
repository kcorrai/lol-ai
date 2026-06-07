import Image from "next/image";

const DDR_V2 = "15.14.1";
const sq2 = (n: string) => `https://ddragon.leagueoflegends.com/cdn/${DDR_V2}/img/champion/${n}.png`;

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

// ── Draft Analyzer ────────────────────────────────────────────────────────────

const BLUE_PICKS = ["Malphite", "Hecarim", "Orianna", "Jinx", "Thresh"];
const RED_PICKS = ["Darius", "Vi", "Yasuo", "Caitlyn", "Lulu"];

const COMP_METRICS: { label: string; blue: number; red: number }[] = [
  { label: "Engage", blue: 8, red: 4 },
  { label: "Teamfight", blue: 7, red: 9 },
  { label: "Split Push", blue: 5, red: 7 },
  { label: "Pick Potential", blue: 4, red: 8 },
];

const KEY_MATCHUPS: { blue: string; red: string; adv: "blue" | "red" | "even" }[] = [
  { blue: "Orianna", red: "Yasuo", adv: "red" },
  { blue: "Malphite", red: "Darius", adv: "blue" },
  { blue: "Thresh", red: "Lulu", adv: "even" },
];

function DraftAnalyzerMockup() {
  return (
    <WindowChrome title="LoL AI Coach · Draft Analyzer">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(["Blue Team", "Red Team"] as const).map((team) => {
            const picks = team === "Blue Team" ? BLUE_PICKS : RED_PICKS;
            return (
              <div key={team}>
                <p className={`mb-1 text-[9px] font-bold ${team === "Blue Team" ? "text-blue-400" : "text-danger"}`}>{team}</p>
                {picks.map((champ) => (
                  <div key={champ} className="mb-0.5 flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1">
                    <Image src={sq2(champ)} alt={champ} width={20} height={20} className="rounded object-cover" />
                    <span className="text-[10px] text-text-muted">{champ}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-2.5">
          <p className="mb-2 text-[8px] font-bold uppercase tracking-wider text-text-muted">Composition Scores</p>
          <div className="space-y-1.5">
            {COMP_METRICS.map(({ label, blue, red }) => (
              <div key={label}>
                <div className="mb-0.5 flex items-center justify-between text-[9px]">
                  <span className="text-text-muted">{label}</span>
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-400">{blue}</span>
                    <span className="font-bold text-danger">{red}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 overflow-hidden rounded-full bg-surface">
                    <div className="h-1.5 rounded-full bg-blue-400/70" style={{ width: `${blue * 10}%` }} />
                  </div>
                  <div className="flex-1 overflow-hidden rounded-full bg-surface">
                    <div className="h-1.5 rounded-full bg-danger/70" style={{ width: `${red * 10}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2">
            <p className="mb-0.5 text-[8px] font-bold text-blue-400">BLUE WIN CON</p>
            <p className="text-[9px] font-semibold text-text">Force 5v5 teamfights</p>
            <p className="mt-0.5 text-[9px] text-text-muted">Dragon soul before 30 min — Orianna ball controls every engage</p>
          </div>
          <div className="rounded-md border border-danger/20 bg-danger/5 p-2">
            <p className="mb-0.5 text-[8px] font-bold text-danger">RED WIN CON</p>
            <p className="text-[9px] font-semibold text-text">Splitpush + skirmish</p>
            <p className="mt-0.5 text-[9px] text-text-muted">Yasuo flanks in 5v4 — force Blue to answer sideline</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[8px] font-bold uppercase tracking-wider text-text-muted">Key Matchups</p>
          {KEY_MATCHUPS.map(({ blue, red, adv }) => (
            <div key={`${blue}-${red}`} className="flex items-center gap-2 rounded-md bg-surface-2 px-2 py-1">
              <span className="text-[9px] text-text">{blue}</span>
              <span className="text-[8px] text-text-muted">vs</span>
              <span className="text-[9px] text-text">{red}</span>
              <span className={`ml-auto rounded px-1.5 py-0.5 text-[8px] font-bold ${adv === "blue" ? "bg-blue-400/10 text-blue-400" : adv === "red" ? "bg-danger/10 text-danger" : "bg-surface text-text-muted"}`}>
                {adv === "even" ? "EVEN" : adv === "blue" ? "BLUE ↑" : "RED ↑"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-warning/20 bg-warning/5 px-2.5 py-2">
          <span className="text-[8px] font-bold text-warning shrink-0">⚠ RISK</span>
          <p className="text-[10px] text-text-muted">Red has no reliable frontline — Vi/Yasuo can&apos;t absorb Malphite+Orianna combo damage</p>
        </div>

        <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-warning">Verdict</p>
          <p className="text-[10px] leading-relaxed text-text-muted">
            Blue wins sustained 5v5 teamfights with superior engage. Red must create picks and end before 35 min when Jinx completes full build.
          </p>
        </div>
      </div>
    </WindowChrome>
  );
}

// ── Build Explanation ─────────────────────────────────────────────────────────

interface BuildItem {
  name: string;
  ok: boolean;
  reason: string;
  alt: string | null;
  when: string;
}

const BUILD_ITEMS: BuildItem[] = [
  { name: "Trinity Force", ok: true, reason: "Sheen proc + AD spike extends every trade — correct for split push comp", alt: null, when: "Bruiser comp, 1v1 win condition" },
  { name: "Immortal Shieldbow", ok: true, reason: "Lifeline passive saved you in Baron fight — exactly the matchup it's built for", alt: null, when: "Diving backline, burst-heavy enemies" },
  { name: "Void Staff", ok: false, reason: "Enemy Soraka was the main healing threat — armor pen does nothing against heals", alt: "Mortal Reminder", when: "3+ healers or shields on enemy team" },
  { name: "Ravenous Hydra", ok: true, reason: "AoE wave clear accelerated your splitpush rotation by ~40 seconds per wave", alt: null, when: "Splitpush comp, need waveclear" },
  { name: "Navori Quickblades", ok: true, reason: "CDR on Q tornado reduced 1.5s off your cooldown every kill — compounded over 20 fights", alt: null, when: "High kill rate, ability CDR needed" },
  { name: "Last Whisper", ok: false, reason: "Only 2 tanks on enemy — full armor pen is overkill, you lose too much raw AD", alt: "Lord Dominik's", when: "3+ tanks or 300+ armor targets" },
];

function BuildExplanationMockup() {
  return (
    <WindowChrome title="LoL AI Coach · Build Explanation">
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-3 py-2">
          <Image src={sq2("Yasuo")} alt="Yasuo" width={28} height={28} className="rounded-md object-cover" />
          <div className="flex-1">
            <p className="text-xs font-bold text-text">Yasuo · Mid · 9/2/8</p>
            <p className="text-[10px] text-text-muted">28 min · KDA 5.5</p>
          </div>
          <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">Victory</span>
        </div>

        <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
          <p className="text-[10px] italic text-text-muted">Strong early build — items 5 and 6 cost you 3 late teamfights. Core was correct but situational slots need work.</p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2">
          <span className="mt-0.5 text-sm font-bold text-danger shrink-0">✗</span>
          <div>
            <p className="text-[10px] font-bold text-text">Biggest Mistake: Void Staff in slot 3</p>
            <p className="text-[10px] text-text-muted">Soraka healed 480 HP per cast — Mortal Reminder would have halved that every teamfight.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {BUILD_ITEMS.map(({ name, ok, reason, alt, when }) => (
            <div key={name} className={`rounded-md border p-2 ${ok ? "border-border bg-surface-2" : "border-danger/20 bg-danger/5"}`}>
              <div className="flex items-center gap-2">
                <span className={`shrink-0 text-sm font-bold ${ok ? "text-success" : "text-danger"}`}>{ok ? "✓" : "✗"}</span>
                <span className="text-[11px] font-semibold text-text">{name}</span>
                {alt && <span className="ml-auto shrink-0 text-[9px] text-danger">→ {alt}</span>}
              </div>
              <p className="mt-0.5 pl-5 text-[9px] leading-snug text-text-muted">{reason}</p>
              <p className="mt-0.5 pl-5 text-[8px] text-text-muted/60">Use when: {when}</p>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border bg-surface-2 px-2 py-1.5">
          <span className="text-[8px] font-bold uppercase text-text-muted">Build Path: </span>
          <span className="text-[9px] text-text-muted">Long Sword → BF Sword → Pickaxe → Trinity → Shieldbow → Hydra → Navori</span>
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
    title: "Draft Analyzer",
    description:
      "Input any 10-champion draft and get a full breakdown: composition scores across 4 dimensions, win conditions per team, key lane matchups with advantage, and risks you need to play around.",
    mockup: <DraftAnalyzerMockup />,
  },
  {
    title: "Build Explanation",
    description:
      "Every item in your last game, explained. Was that Ravenous Hydra the right call? What should you have built instead? Get honest item-by-item coaching — including the biggest mistake you made.",
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
