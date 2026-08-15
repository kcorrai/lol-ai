import {
  BarChart2, MessageCircle, Shield, TrendingUp, Trophy,
} from "lucide-react";
import { ReportPreview, CounterPreview, ChampionPreview } from "./FeaturePreviews";

// ── Side feature cards ───────────────────────────────────────────────────────

// One accent, rationed (ADR-015). Feature icons are decoration, not data, so they
// all take the accent — a rainbow of support hues here would read as a second brand.
const SIDE_FEATURES = [
  { icon: Trophy, title: "Ranked Progress", desc: "LP history, win rate trends, tilt detection — before it becomes a loss streak.", color: "text-accent", bg: "bg-accent/10" },
  { icon: MessageCircle, title: "AI Coach Chat", desc: "Ask anything. Backed by your real match data, not generic wiki answers.", color: "text-accent", bg: "bg-accent/10" },
  { icon: Shield, title: "Mental & Tilt Guard", desc: "Session readiness score. Know when to queue and when to stop.", color: "text-accent", bg: "bg-accent/10" },
  { icon: BarChart2, title: "Match Deep Dive", desc: "Full 10-player scoreboard — damage, vision, objectives, runes.", color: "text-accent", bg: "bg-accent/10" },
  { icon: TrendingUp, title: "Climb Roadmap", desc: "AI-built path from your current rank to the next. Step by step.", color: "text-accent", bg: "bg-accent/10" },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-surface py-24">
      {/* Atmospheric glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-[#5846B4]/6 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">Full Arsenal</p>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Everything You Need to{" "}
            <span className="text-accent" style={{ textShadow: "0 0 30px rgba(198,255,61,0.3)" }}>Climb</span>
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
            <div className="rounded-xl border border-info/30 bg-info/5 px-3 py-1.5 text-xs font-semibold text-info self-start">
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
              <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent self-start">
                Champion Pool Analytics
              </div>
              <h3 className="font-display text-xl font-bold text-text">Know what to play — and what to bench</h3>
              <ChampionPreview />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SIDE_FEATURES.slice(0, 3).map(({ icon: Icon, title, desc, color, bg }) => (
                <div key={title} className="gaming-card flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:border-accent/20">
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
            <div key={title} className="gaming-card flex items-start gap-4 rounded-xl p-4 transition-all duration-200 hover:border-accent/20">
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
