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
    <section className="relative overflow-hidden py-20">
      {/* Subtle background strip */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#5846B4]/[0.04] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">
            Simple Process
          </p>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">How It Works</h2>
          <p className="mt-3 text-text-muted">From account to coaching report in under a minute.</p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connecting line — desktop only */}
          <div
            className="absolute left-[calc(16.66%+32px)] right-[calc(16.66%+32px)] top-10 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(198,255,61,0.25) 20%, rgba(198,255,61,0.25) 80%, transparent)",
            }}
          />

          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="gaming-card relative flex flex-col items-center rounded-2xl p-6 text-center"
            >
              {/* Step icon circle */}
              <div className="relative mb-5">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/30 bg-accent/10"
                  style={{
                    boxShadow:
                      "0 0 32px rgba(198,255,61,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon className="h-8 w-8 text-accent" />
                </div>
                <span
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-background"
                  style={{ boxShadow: "0 0 12px rgba(198,255,61,0.5)" }}
                >
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
