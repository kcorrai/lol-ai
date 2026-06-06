import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CellValue = string | boolean;

interface FeatureRow {
  feature: string;
  free: CellValue;
  pro: CellValue;
  category?: string;
}

const ROWS: FeatureRow[] = [
  // Core
  { feature: "AI Coaching Reports",       free: "3 / month",    pro: "Unlimited",    category: "Core" },
  { feature: "Riot Accounts",             free: "1",            pro: "3",            category: "Core" },
  { feature: "Match History Depth",       free: "10 games",     pro: "100 games",    category: "Core" },
  { feature: "Match Deep Dive",           free: true,           pro: true,           category: "Core" },
  { feature: "Ranked Progress Tracking",  free: true,           pro: true,           category: "Core" },
  { feature: "Coach Chat",                free: true,           pro: true,           category: "Core" },
  // Tools
  { feature: "Counter Pick",              free: "3 counters",   pro: "Full list",    category: "Tools" },
  { feature: "Draft Analyzer",            free: true,           pro: true,           category: "Tools" },
  { feature: "OTP Assistant",             free: true,           pro: true,           category: "Tools" },
  { feature: "Matchup Koçu",             free: "3 / day",      pro: "Unlimited",    category: "Tools" },
  // Pro exclusive
  { feature: "Matchup Intelligence",      free: false,          pro: true,           category: "Pro Exclusive" },
  { feature: "Champion Mastery Score",    free: false,          pro: true,           category: "Pro Exclusive" },
  { feature: "Habit Detection Engine",    free: false,          pro: true,           category: "Pro Exclusive" },
  { feature: "Improvement Tracker",       free: "Active plan",  pro: "Full history", category: "Pro Exclusive" },
  { feature: "Shareable AI Report Cards", free: false,          pro: true,           category: "Pro Exclusive" },
  { feature: "Weekly AI Emails",          free: false,          pro: true,           category: "Pro Exclusive" },
  { feature: "Voice Coaching (TTS)",      free: false,          pro: true,           category: "Pro Exclusive" },
  { feature: "Priority AI Processing",    free: false,          pro: true,           category: "Pro Exclusive" },
];

function Cell({ value, isPro }: { value: CellValue; isPro: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={cn("mx-auto h-4 w-4", isPro ? "text-accent" : "text-success")} />
    ) : (
      <X className="mx-auto h-4 w-4 text-text-muted/30" />
    );
  }
  return <span className={cn("text-sm", isPro ? "font-medium text-accent" : "text-text-muted")}>{value}</span>;
}

export function PricingComparisonTable() {
  let lastCategory = "";

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-6 py-4 text-sm font-medium text-text-muted">Feature</th>
            <th className="px-6 py-4 text-center text-sm font-bold text-text">Free</th>
            <th className="px-6 py-4 text-center text-sm font-bold text-accent">Pro</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ feature, free, pro, category }, i) => {
            const showCategory = category && category !== lastCategory;
            if (category) lastCategory = category;

            return [
              showCategory ? (
                <tr key={`cat-${category}`} className="bg-surface-2 border-t border-border">
                  <td colSpan={3} className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-text-muted/50">
                    {category}
                  </td>
                </tr>
              ) : null,
              <tr
                key={feature}
                className={cn(
                  "border-t border-border/40",
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/50"
                )}
              >
                <td className="px-6 py-3.5 text-sm text-text-muted">{feature}</td>
                <td className="px-6 py-3.5 text-center"><Cell value={free} isPro={false} /></td>
                <td className="px-6 py-3.5 text-center"><Cell value={pro} isPro={true} /></td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
