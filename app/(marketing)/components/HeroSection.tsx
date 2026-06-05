import Link from "next/link";

function DashboardMockup() {
  return (
    <div className="relative rounded-xl border border-border bg-surface shadow-2xl">
      {/* Window chrome */}
      <div className="flex h-8 items-center gap-1.5 rounded-t-xl border-b border-border bg-surface-2 px-3">
        <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-text-muted">LoL AI Coach · Dashboard</span>
      </div>

      <div className="space-y-3 p-4">
        {/* Player header */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <div className="h-10 w-10 rounded-full bg-accent/20 ring-2 ring-border" />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1 text-[9px] font-bold text-text-muted ring-1 ring-border">
              247
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-text">
              Faker<span className="text-text-muted">#KR1</span>
            </p>
            <p className="text-xs text-text-muted">KR · Challenger · 1,426 LP</p>
          </div>
          <div className="ml-auto rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            Pro
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {([["KDA", "6.8"], ["Win Rate", "68%"], ["CS/min", "9.4"]] as [string, string][]).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-surface-2 p-2 text-center">
              <div className="text-sm font-bold text-accent">{value}</div>
              <div className="text-[10px] text-text-muted">{label}</div>
            </div>
          ))}
        </div>

        {/* Match row */}
        <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2">
          <div className="h-8 w-8 shrink-0 rounded-md bg-accent/20" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text">Orianna</p>
            <p className="text-[10px] text-text-muted">9/1/14 · 4.8 KDA · Mid</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5">
              <div className="h-4 w-4 rounded-sm bg-surface-2 ring-1 ring-border" />
              <div className="h-4 w-4 rounded-sm bg-surface-2 ring-1 ring-border" />
            </div>
            <div className="flex gap-0.5">
              <div className="h-4 w-4 rounded-full bg-accent/20 ring-1 ring-accent/30" />
              <div className="h-4 w-4 rounded-full bg-surface-2 ring-1 ring-border" />
            </div>
          </div>
          <div className="text-[10px] font-medium text-success ml-1">Victory</div>
        </div>

        {/* AI insight */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-accent">AI Coach Insight</p>
          <p className="text-xs leading-relaxed text-text-muted">
            &ldquo;Your mid-game roaming is 38% more impactful than last week. Keep prioritizing
            vision before objectives — your ward coverage is Challenger-level.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              7 AI Tools · Match Analysis · Climb Faster
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-text md:text-5xl lg:text-6xl">
              Your Personal{" "}
              <span className="text-accent">AI Coach</span>{" "}
              for League
            </h1>
            <p className="text-lg leading-relaxed text-text-muted">
              Connect your Riot account. Get specific, honest feedback on every game — not generic
              Bronze tips. Track your ranked progress and stop being hardstuck.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-md bg-accent px-6 py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-text-muted transition-colors hover:border-accent/50 hover:text-text"
              >
                See Pricing
              </Link>
            </div>
            <p className="text-xs text-text-muted">No credit card required · Free tier available</p>

            {/* Quick stats */}
            <div className="flex gap-6 border-t border-border pt-6">
              {([
                ["5 AI Tools", "Counter, Matchup, OTP, Draft, Build"],
                ["AI Reports", "Session & Climb roadmap"],
                ["Real Match Data", "Your games, not generic guides"],
              ] as [string, string][]).map(([title, sub]) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-text">{title}</p>
                  <p className="text-[11px] text-text-muted">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="mx-auto w-full max-w-sm md:max-w-none">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
