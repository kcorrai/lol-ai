const B2B_FEATURES = [
  {
    title: "Bulk Member Analysis",
    description: "Coach dashboard: see all players' ranks, 7-day WR, KDA, and CS stats on one screen.",
    icon: "📊",
  },
  {
    title: "Weekly Team Report",
    description: "Auto email every Monday: who's hot, who's struggling, which player needs coaching.",
    icon: "📬",
  },
  {
    title: "Multi-Team Support",
    description: "Create up to 5 teams. Manage different school leagues, age groups separately.",
    icon: "🏆",
  },
];

// B2B / Esports academy pitch below the pricing cards. Static content — kept out
// of the client PricingContent so that stays focused on the plan toggle.
export function PricingB2BSection() {
  return (
    <div className="mx-auto mt-24 max-w-4xl">
      <div className="mb-10 text-center">
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">B2B / Esports</span>
        <h2 className="mt-4 font-display text-3xl font-bold text-text">For Esports Academies &amp; Clubs</h2>
        <p className="mt-3 text-text-muted">
          Manage multiple teams, bulk-analyze your students, and automate weekly performance reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {B2B_FEATURES.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <span className="text-2xl">{item.icon}</span>
            <p className="font-semibold text-text">{item.title}</p>
            <p className="text-sm text-text-muted">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 p-6 flex flex-col items-center gap-4 text-center md:flex-row md:text-left md:items-start">
        <div className="flex-1">
          <p className="text-lg font-bold text-text">Team Plan — $29.99/month</p>
          <p className="mt-1 text-sm text-text-muted">
            5 teams, 5 members/team, weekly reports, coach/player roles. All Pro features included.
            We can offer custom enterprise pricing for large academies.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a
            href="/settings/billing"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:bg-accent/90"
          >
            Start Team
          </a>
          <a
            href="mailto:team@lolaicoach.gg"
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-2"
          >
            Get Enterprise Quote
          </a>
        </div>
      </div>
    </div>
  );
}
