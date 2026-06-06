import Image from "next/image";
import {
  CheckCircle2, XCircle, Zap, BarChart2,
  MessageCircle, Shield, TrendingUp, Trophy,
} from "lucide-react";

const DDR = "https://ddragon.leagueoflegends.com/cdn";
const VER = "15.14.1";
const sq = (name: string) => `${DDR}/${VER}/img/champion/${name}.png`;
const splash = (name: string) => `${DDR}/img/champion/splash/${name}_0.jpg`;

// ── Coaching Report Preview ──────────────────────────────────────────────────

function ReportPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      {/* Hero with splash */}
      <div className="relative h-32">
        <Image src={splash("Yasuo")} alt="" fill className="object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-6 p-4">
          {[["8", "Matches"], ["Gold II", "Potential"], ["23s", "AI Time"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="text-base font-bold text-text">{v}</p>
              <p className="text-[10px] text-text-muted">{l}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="space-y-2.5 p-4">
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5">
          <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">Coach Says</p>
          <p className="text-[11px] italic leading-relaxed text-text-muted">
            &ldquo;Your wave management is the reason you&apos;re losing lanes you should win. Fix your freeze before the next climb.&rdquo;
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-success/20 bg-success/5 p-2">
            <div className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase text-success">
              <CheckCircle2 className="h-2.5 w-2.5" /> Strengths
            </div>
            {["Roaming", "Team fights"].map((s) => (
              <div key={s} className="flex items-center gap-1.5 py-0.5">
                <div className="h-1 w-1 rounded-full bg-success" />
                <p className="text-[10px] text-text-muted">{s}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-2">
            <div className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase text-danger">
              <XCircle className="h-2.5 w-2.5" /> Weaknesses
            </div>
            {["Wave control", "Vision"].map((w) => (
              <div key={w} className="flex items-center gap-1.5 py-0.5">
                <span className="rounded border border-danger/30 bg-danger/10 px-1 text-[8px] font-semibold text-danger">high</span>
                <p className="text-[10px] text-text-muted">{w}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-2">
          <div className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase text-accent">
            <Zap className="h-2.5 w-2.5" /> Action Items
          </div>
          <p className="text-[10px] text-text-muted">Practice freeze mechanics in practice tool 15 min/day</p>
          <div className="mt-1 flex gap-1">
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[8px] text-text-muted">+0.5 LP/game</span>
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[8px] text-text-muted">1 week</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Counter Pick Preview ─────────────────────────────────────────────────────

function CounterPreview() {
  const counters = [
    { name: "Malphite", key: "Malphite", tier: "S", diff: "Easy", cls: "text-success border-success/30 bg-success/10" },
    { name: "Pantheon", key: "Pantheon", tier: "A", diff: "Easy", cls: "text-accent border-accent/30 bg-accent/10" },
    { name: "Renekton", key: "Renekton", tier: "A", diff: "Med", cls: "text-accent border-accent/30 bg-accent/10" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
      <div className="border-b border-border bg-surface-2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Image src={sq("Yasuo")} alt="Yasuo" width={24} height={24} className="rounded" />
          <p className="text-xs font-semibold text-text">Yasuo · Mid</p>
          <span className="ml-auto text-[10px] text-text-muted">Counters</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        {counters.map(({ name, key, tier, diff, cls }) => (
          <div key={name} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface-2 p-2">
            <Image src={sq(key)} alt={name} width={40} height={40} className="rounded-lg object-cover ring-1 ring-border" />
            <p className="text-[10px] font-semibold text-text">{name}</p>
            <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${cls}`}>{tier} · {diff}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-4 rounded-lg border border-teal-500/30 bg-teal-500/5 p-2.5">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-teal-400">AI Tip</p>
        <p className="text-[11px] text-text-muted">Trade when Wind Wall is on cooldown — Malphite has no projectiles to block</p>
      </div>
    </div>
  );
}

// ── Champion Analytics Preview ───────────────────────────────────────────────

function ChampionPreview() {
  const champs = [
    { key: "Yasuo", name: "Yasuo", wr: "57%", kda: "6.2", color: "text-success" },
    { key: "Zed", name: "Zed", wr: "51%", kda: "4.8", color: "text-text" },
    { key: "Orianna", name: "Orianna", wr: "49%", kda: "4.1", color: "text-warning" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
      <div className="border-b border-border bg-surface-2 px-4 py-2.5">
        <p className="text-xs font-semibold text-text">Champion Pool Analytics</p>
      </div>
      <div className="divide-y divide-border">
        {champs.map(({ key, name, wr, kda, color }) => (
          <div key={name} className="flex items-center gap-3 px-4 py-3">
            <Image src={sq(key)} alt={name} width={36} height={36} className="rounded-lg object-cover ring-1 ring-border" />
            <p className="flex-1 text-sm font-semibold text-text">{name}</p>
            <div className="text-right">
              <p className={`text-sm font-bold ${color}`}>{wr}</p>
              <p className="text-[10px] text-text-muted">KDA {kda}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Side feature cards ───────────────────────────────────────────────────────

const SIDE_FEATURES = [
  { icon: Trophy, title: "Ranked Progress", desc: "LP history, win rate trends, tilt detection — before it becomes a loss streak.", color: "text-warning", bg: "bg-warning/10" },
  { icon: MessageCircle, title: "AI Coach Chat", desc: "Ask anything. Backed by your real match data, not generic wiki answers.", color: "text-accent", bg: "bg-accent/10" },
  { icon: Shield, title: "Mental & Tilt Guard", desc: "Session readiness score. Know when to queue and when to stop.", color: "text-danger", bg: "bg-danger/10" },
  { icon: BarChart2, title: "Match Deep Dive", desc: "Full 10-player scoreboard — damage, vision, objectives, runes.", color: "text-success", bg: "bg-success/10" },
  { icon: TrendingUp, title: "Climb Roadmap", desc: "AI-built path from your current rank to the next. Step by step.", color: "text-accent", bg: "bg-accent/10" },
];

export function FeaturesSection() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Everything You Need to Climb
          </h2>
          <p className="mt-3 text-text-muted">From pre-game draft to post-game analysis — every phase covered.</p>
        </div>

        {/* Main showcase row */}
        <div className="mb-12 grid gap-6 lg:grid-cols-3">
          {/* Coaching Report — spans 1 col */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent self-start">
              AI Coaching Reports
            </div>
            <h3 className="font-display text-xl font-bold text-text">Your coach never sleeps</h3>
            <p className="text-sm leading-relaxed text-text-muted">
              Session Review + Climb Roadmap reports. Champion splash header, strength &amp; weakness breakdown, icon-based action plan — all generated from your real match data.
            </p>
            <ReportPreview />
          </div>

          {/* Counter Pick — spans 1 col */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 px-3 py-1.5 text-xs font-semibold text-teal-400 self-start">
              Counter Pick Generator
            </div>
            <h3 className="font-display text-xl font-bold text-text">Pick the right champion every game</h3>
            <p className="text-sm leading-relaxed text-text-muted">
              Real champion icons, tier ratings, and a single tip that actually matters — generated for any matchup in seconds.
            </p>
            <CounterPreview />
          </div>

          {/* Champion Analytics + side features — spans 1 col */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-1.5 text-xs font-semibold text-warning self-start">
                Champion Pool Analytics
              </div>
              <h3 className="font-display text-xl font-bold text-text">Know what to play — and what to bench</h3>
              <ChampionPreview />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SIDE_FEATURES.slice(0, 3).map(({ icon: Icon, title, desc, color, bg }) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text">{title}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom 2 feature cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SIDE_FEATURES.slice(3).map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="flex items-start gap-4 rounded-xl border border-border bg-background p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-text">{title}</p>
                <p className="mt-0.5 text-sm text-text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
