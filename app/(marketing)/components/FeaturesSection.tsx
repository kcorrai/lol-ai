import { Brain, Swords, Trophy, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Coaching Reports",
    description:
      "GPT-4 powered analysis of your gameplay. Specific feedback on positioning, decision-making, and itemization — not generic Bronze advice.",
    badge: null,
  },
  {
    icon: Swords,
    title: "Match Deep Dive",
    description:
      "Full scoreboard breakdown for every game. 10-player stats, damage charts, vision scores, and KDA comparisons against your elo.",
    badge: null,
  },
  {
    icon: Trophy,
    title: "Ranked Progress",
    description:
      "Track your LP journey over time. See your win rate trends, best champions, and where you're losing games you should be winning.",
    badge: null,
  },
  {
    icon: Users,
    title: "Champion Analytics",
    description:
      "Understand your champion pool at a glance. Which champions are carrying you and which are holding you back.",
    badge: "Coming Soon",
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, badge }) => (
            <div
              key={title}
              className="relative rounded-xl border border-border bg-background p-6 transition-colors hover:border-accent/30"
            >
              {badge && (
                <span className="absolute right-3 top-3 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {badge}
                </span>
              )}
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
