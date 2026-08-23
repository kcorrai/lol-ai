interface CompareRow {
  label: string;
  free: string;
  pro: string;
  team: string;
}

interface CompareGroup {
  title: string;
  rows: CompareRow[];
}

const COLS = "grid grid-cols-[minmax(0,1fr)_100px_100px_100px] items-center gap-4 px-5";

/**
 * Only the rows that differ.
 *
 * A comparison table that repeats what every plan shares is a table nobody
 * reads to the end. What is common to all three is stated once underneath.
 */
const GROUPS: CompareGroup[] = [
  {
    title: "How much it reads",
    rows: [
      { label: "AI coaching reports", free: "3 / month", pro: "Unlimited", team: "Unlimited" },
      { label: "Match history depth", free: "10 games", pro: "100 games", team: "100 games" },
      { label: "Riot accounts", free: "1", pro: "3", team: "5" },
      { label: "Counter picks per champion", free: "3", pro: "Full list", team: "Full list" },
    ],
  },
  {
    title: "Pro coaching",
    rows: [
      { label: "Matchup intelligence", free: "—", pro: "Yes", team: "Yes" },
      { label: "Champion mastery score", free: "—", pro: "Yes", team: "Yes" },
      { label: "Habit detection engine", free: "—", pro: "Yes", team: "Yes" },
      { label: "Improvement plan history", free: "—", pro: "Full", team: "Full" },
      { label: "Shareable AI report cards", free: "—", pro: "Yes", team: "Yes" },
      { label: "Weekly development email", free: "—", pro: "Yes", team: "Yes" },
      { label: "Voice coaching", free: "—", pro: "Yes", team: "Yes" },
      { label: "Priority AI processing", free: "—", pro: "Yes", team: "Yes" },
    ],
  },
  {
    title: "Teams",
    rows: [
      { label: "Team management", free: "—", pro: "—", team: "Up to 5 teams" },
      { label: "Team performance dashboard", free: "—", pro: "—", team: "Yes" },
      { label: "Coach / player roles", free: "—", pro: "—", team: "Yes" },
      { label: "Email member invitations", free: "—", pro: "—", team: "Yes" },
      { label: "Bulk member analysis", free: "—", pro: "—", team: "Yes" },
    ],
  },
];

function Cell({ value, tone }: { value: string; tone?: "pro" | "team" }): React.JSX.Element {
  const color =
    value === "—"
      ? "text-ink-400"
      : tone === "pro"
        ? "text-acid-500"
        : tone === "team"
          ? "text-fg-1"
          : "text-fg-2";
  return (
    <span className={`text-center font-mono text-[12.5px] tabular-nums ${color}`}>{value}</span>
  );
}

export function PricingCompare(): React.JSX.Element {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-label text-fg-1">
          What actually differs
        </span>
        <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-fg-4 sm:inline">
          Rows identical across plans are not listed
        </span>
        <span className="h-px flex-1 bg-line-1" />
      </div>

      <div className="notch overflow-x-auto border border-border bg-surface">
        <div className="min-w-[640px]">
          <div
            className={`${COLS} border-b border-line-2 bg-surface-2 py-3 font-mono text-[10px] uppercase tracking-label text-text-muted`}
          >
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center text-acid-500">Pro</span>
            <span className="text-center">Team</span>
          </div>

          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="border-b border-line-1 bg-surface-dark px-5 py-2 font-mono text-[9.5px] uppercase tracking-label text-text-muted">
                {group.title}
              </div>
              {group.rows.map((row) => (
                <div key={row.label} className={`${COLS} border-b border-line-1 py-2.5`}>
                  <span className="text-sm text-fg-2">{row.label}</span>
                  <Cell value={row.free} />
                  <Cell value={row.pro} tone="pro" />
                  <Cell value={row.team} tone="team" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-fg-4">
        All plans include unlimited match sync, the free tools, and dashboard access. No hidden
        fees.
      </p>
    </section>
  );
}
