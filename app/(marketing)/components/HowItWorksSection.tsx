import { Link2, BarChart3, TrendingUp } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Link2,
    title: "Connect Your Account",
    description:
      "Enter your GameName#TAG and region. We sync your last 20 ranked matches automatically — no API keys, no setup.",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "We Analyze Everything",
    description:
      "Every fight, death, CS difference, objective, rune, and summoner spell. Full match detail with tracker.gg-style scoreboard.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Get Your Coaching Report",
    description:
      "Generate a Session Review or Climb Roadmap with one click. Specific, actionable feedback — not generic advice for Bronze players.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">How It Works</h2>
          <p className="mt-3 text-text-muted">From account to coaching report in under a minute.</p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connecting line — desktop only */}
          <div className="absolute left-1/3 right-1/3 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />

          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="relative flex flex-col items-center text-center">
              <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
                <Icon className="h-7 w-7 text-accent" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background">
                  {number.slice(-1)}
                </span>
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-text">{title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
