import { Brain, Swords, Trophy, Shield, MessageCircle, BarChart2 } from "lucide-react";

const FEATURES = [
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

export function FeaturesSection() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Everything You Need to Climb
          </h2>
          <p className="mt-3 text-text-muted">
            Built for players who are serious about improving, not just playing more games.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-background p-6 transition-colors hover:border-accent/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-2 font-display text-base font-bold text-text">{title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
