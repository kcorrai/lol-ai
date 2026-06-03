import Link from "next/link";

function DashboardMockup() {
  return (
    <div className="relative rounded-xl border border-border bg-surface shadow-2xl">
      {/* Window chrome */}
      <div className="flex h-8 items-center gap-1.5 rounded-t-xl border-b border-border bg-surface-2 px-3">
        <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-text-muted">lol-ai-coach · Dashboard</span>
      </div>

      <div className="space-y-3 p-4">
        {/* Ranked card */}
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">Ranked Solo/Duo</span>
            <span className="text-xs font-bold text-rank-gold">GOLD II</span>
          </div>
          <p className="mb-2 text-sm font-bold text-text">kaanproak0 #TR1</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full w-[47%] rounded-full bg-rank-gold" />
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-text-muted">47 LP</span>
            <span className="text-xs text-text-muted">100 LP</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["KDA", "4.2"],
              ["Win Rate", "58%"],
              ["CS/min", "7.2"],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-surface-2 p-2 text-center"
            >
              <div className="text-sm font-bold text-accent">{value}</div>
              <div className="text-xs text-text-muted">{label}</div>
            </div>
          ))}
        </div>

        {/* AI insight */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="mb-1.5 text-xs font-bold text-accent">🤖 AI Coach Insight</p>
          <p className="text-xs leading-relaxed text-text-muted">
            &ldquo;Your vision score (18/game) is 34% below Gold average. Prioritize ward placement
            in river and enemy jungle entrances during mid-game transitions.&rdquo;
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
              AI-Powered League of Legends Coaching
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-text md:text-5xl lg:text-6xl">
              Your AI Coach is{" "}
              <span className="text-accent">Watching Your Games</span>
            </h1>
            <p className="text-lg leading-relaxed text-text-muted">
              Connect your Riot account. Get specific, honest feedback on what&rsquo;s holding you
              back. Stop being hardstuck.
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
