import { Brain, Swords, Trophy, Shield, MessageCircle, BarChart2, Target, Crosshair, Star, Users } from "lucide-react";

const CORE_FEATURES = [
  {
    icon: Brain,
    title: "AI Coaching Reports",
    description:
      "GPT-4 powered analysis of your last 5–10 games. Session Review breaks down specific mistakes. Climb Roadmap builds your path to the next rank.",
  },
  {
    icon: Swords,
    title: "Match Deep Dive",
    description:
      "tracker.gg-style scoreboard for every game — 10-player stats, damage bars, vision, summoner spells, rune icons, and team objective breakdown.",
  },
  {
    icon: Trophy,
    title: "Ranked Progress",
    description:
      "Track your LP history over time. See win rate trends, your best roles, and where you're dropping games you should be winning.",
  },
  {
    icon: BarChart2,
    title: "Champion Analytics",
    description:
      "Understand your champion pool at a glance. Deep-dive stats per champion — KDA, win rate, CS/min — so you know what to play and what to bench.",
  },
  {
    icon: Shield,
    title: "Mental & Tilt Detection",
    description:
      "Detects tilt patterns from your recent games. Warns you before a loss streak becomes a mental crisis. Session readiness score before you queue.",
  },
  {
    icon: MessageCircle,
    title: "AI Coach Chat",
    description:
      "Ask your coach anything — draft questions, matchup advice, build paths. Backed by your real match data, not generic wiki answers.",
  },
] as const;

const AI_TOOLS = [
  {
    icon: Target,
    title: "Counter Pick Generator",
    description:
      "Instantly find the best counters for any champion-role combo. Tier ratings, difficulty scores, build hints, and one-liner tips — all AI generated.",
  },
  {
    icon: Crosshair,
    title: "Matchup Coach",
    description:
      "Full lane matchup breakdown: trade windows, wave management, build paths, and critical mistakes for any champion pairing.",
  },
  {
    icon: Star,
    title: "OTP Assistant",
    description:
      "Your dedicated one-trick coach. Matchup tier lists, hidden mechanics, power spikes, ban priorities, and meta ratings.",
  },
  {
    icon: Users,
    title: "Draft Analyzer",
    description:
      "Analyze any 10-champion draft. Team composition scores, win conditions, scaling profiles, and risks for both sides.",
  },
] as const;

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 transition-colors hover:border-accent/30">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <h3 className="mb-2 font-display text-base font-bold text-text">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Everything You Need to Climb — From Draft to Post-Game
          </h2>
          <p className="mt-3 text-text-muted">
            Built for players who are serious about improving, not just playing more games.
          </p>
        </div>

        <div className="mb-16">
          <div className="mb-8 flex items-center gap-4">
            <h3 className="font-display text-lg font-bold text-text">Temel Özellikler</h3>
            <div className="flex-1 border-t border-border" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_FEATURES.map(({ icon, title, description }) => (
              <FeatureCard key={title} icon={icon} title={title} description={description} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-8 flex items-center gap-4">
            <h3 className="font-display text-lg font-bold text-text">AI Araçları</h3>
            <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              New
            </div>
            <div className="flex-1 border-t border-border" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AI_TOOLS.map(({ icon, title, description }) => (
              <FeatureCard key={title} icon={icon} title={title} description={description} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
