import { Check, X } from "lucide-react";

type CellValue = string | boolean;

interface FeatureRow {
  feature: string;
  free: CellValue;
  pro: CellValue;
}

const ROWS: FeatureRow[] = [
  { feature: "AI Coaching Reports", free: "3 / month", pro: "Unlimited" },
  { feature: "Riot Accounts", free: "1", pro: "3" },
  { feature: "Match History Depth", free: "10 games", pro: "100 games" },
  { feature: "Match Deep Dive", free: true, pro: true },
  { feature: "Ranked Progress Tracking", free: true, pro: true },
  { feature: "Champion Pool Analytics", free: "Top 3 only", pro: "Full pool" },
  { feature: "Weekly AI Improvement Emails", free: "Basic stats", pro: "Full AI insights" },
  { feature: "Priority AI Processing", free: false, pro: true },
];

function Cell({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-success" />
    ) : (
      <X className="mx-auto h-4 w-4 text-text-muted/40" />
    );
  }
  return <span className="text-sm text-text">{value}</span>;
}

export function PricingComparisonTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-6 py-4 text-sm font-medium text-text-muted">Feature</th>
            <th className="px-6 py-4 text-center text-sm font-bold text-text">Free</th>
            <th className="px-6 py-4 text-center text-sm font-bold text-accent">Pro</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ feature, free, pro }, i) => (
            <tr
              key={feature}
              className={i % 2 === 0 ? "bg-surface" : "bg-surface-2"}
            >
              <td className="px-6 py-3.5 text-sm text-text-muted">{feature}</td>
              <td className="px-6 py-3.5 text-center">
                <Cell value={free} />
              </td>
              <td className="px-6 py-3.5 text-center">
                <Cell value={pro} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
