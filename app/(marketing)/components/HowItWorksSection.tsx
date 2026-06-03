import { Link2, BarChart3, TrendingUp } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Link2,
    title: "Connect",
    description:
      "Link your Riot account in 30 seconds. Just enter your GameName#TAG and region — no API keys, no setup.",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "Analyze",
    description:
      "We sync your last 20 ranked matches and run them through our AI pipeline. Every fight, every death, every CS difference.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Improve",
    description:
      "Get a personalized coaching report with specific, actionable feedback. Not generic tips — your exact mistakes.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">How It Works</h2>
          <p className="mt-3 text-text-muted">Three steps from account to coaching report.</p>
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
