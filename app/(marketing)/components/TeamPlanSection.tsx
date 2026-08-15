import Link from "next/link";
import { Users, BarChart2, Mail, Trophy, Shield, Check } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "5-Person Team",
    desc: "Full 5v5 roster support. Separate AI analysis and coaching report for each member.",
  },
  {
    icon: BarChart2,
    title: "Coach Dashboard",
    desc: "See all players' ranks, KDA, and CS stats on one screen.",
  },
  {
    icon: Mail,
    title: "Weekly Team Report",
    desc: "Auto email every Monday: who's hot, who's struggling, who needs coaching.",
  },
  {
    icon: Trophy,
    title: "Up to 5 Teams",
    desc: "Manage different groups, leagues, or age tiers as separate teams.",
  },
  {
    icon: Shield,
    title: "Coach & Player Roles",
    desc: "As a coach, manage all members; players focus only on their own data.",
  },
];

const PLAN_FEATURES = [
  "Unlimited AI Coaching Reports",
  "5 teams of 5 members each (25 members)",
  "Team Performance Dashboard",
  "Coach and player roles",
  "Email member invitations",
  "Weekly auto team report",
  "Bulk member analysis",
  "All Pro features included",
];

export function TeamPlanSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute left-1/4 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-accent/8 blur-[140px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-accent/6 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
            <Users className="h-3.5 w-3.5" />
            Esports Academies &amp; Teams
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold text-text md:text-5xl lg:text-6xl">
            For Your{" "}
            <span className="text-accent">AI Coach</span>
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-text-muted md:text-lg">
            For esports academies, school leagues, and friend groups. Manage your entire team from one dashboard, track progress with weekly reports.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Feature cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-surface p-5 space-y-2 transition-colors hover:border-accent/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <f.icon className="h-4 w-4 shrink-0 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-text">{f.title}</p>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Pricing card */}
          <div className="relative rounded-2xl border-2 border-accent/40 bg-surface p-8 space-y-6 shadow-[0_0_60px_-15px_rgba(198,255,61,0.25)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-background">
                Most Popular
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Team Plan</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold text-text">$29.99</span>
                <span className="text-text-muted">/month</span>
              </div>
              <p className="mt-1.5 text-sm text-text-muted">
                All Pro features included · 5 teams · 5 members/team
              </p>
            </div>

            <ul className="space-y-2.5">
              {PLAN_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-text">
                  <Check className="h-4 w-4 shrink-0 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3">
              <Link
                href="/register"
                className="block w-full rounded-xl bg-accent px-5 py-3.5 text-center text-sm font-bold text-background transition-opacity hover:opacity-90"
              >
                Start Team — $29.99/month
              </Link>
              <a
                href="mailto:team@lolaicoach.gg"
                className="block w-full rounded-xl border border-border px-5 py-3.5 text-center text-sm font-semibold text-text-muted transition-colors hover:border-accent/40 hover:text-text"
              >
                Get Enterprise Quote
              </a>
            </div>

            <p className="text-center text-xs text-text-muted">
              Secure payment with LemonSqueezy · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
