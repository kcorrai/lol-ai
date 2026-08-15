import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CellValue = string | boolean;

interface FeatureRow {
  feature: string;
  free: CellValue;
  pro: CellValue;
  team: CellValue;
  category?: string;
}

const ROWS: FeatureRow[] = [
  // Core
  { feature: "AI Coaching Reports",       free: "3 / month",       pro: "Unlimited",     team: "Unlimited",    category: "Core" },
  { feature: "Riot Account",               free: "1",            pro: "3",            team: "5",           category: "Core" },
  { feature: "Match History",              free: "10 matches",       pro: "100 matches",      team: "200 matches",     category: "Core" },
  { feature: "Match Detail Analysis",         free: true,           pro: true,           team: true,          category: "Core" },
  { feature: "Ranked Tracking",             free: true,           pro: true,           team: true,          category: "Core" },
  { feature: "Coach Chat",                free: true,           pro: true,           team: true,          category: "Core" },
  // Tools
  { feature: "Counter Pick",              free: "3 counters",    pro: "Full list",    team: "Full list",   category: "Tools" },
  { feature: "Draft Analyzer",            free: true,           pro: true,           team: true,          category: "Tools" },
  { feature: "OTP Assistant",             free: true,           pro: true,           team: true,          category: "Tools" },
  { feature: "Matchup Coach",             free: "3 / day",      pro: "Unlimited",     team: "Unlimited",    category: "Tools" },
  // Pro exclusive
  { feature: "Matchup Intelligence",            free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Champion Mastery Score",    free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Habit Detection Engine",  free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Progress Tracking",            free: false,          pro: "Full history",   team: "Full history",  category: "Pro Exclusive" },
  { feature: "Shareable AI Reports",free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Weekly AI Email",       free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Voice Coaching (TTS)",        free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Priority AI Processing",       free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  // Team exclusive
  { feature: "Team Management",            free: false,          pro: false,          team: "Up to 5 teams", category: "Team Exclusive" },
  { feature: "Per-Member Performance",     free: false,          pro: false,          team: true,          category: "Team Exclusive" },
  { feature: "Coach / Player Roles",    free: false,          pro: false,          team: true,          category: "Team Exclusive" },
  { feature: "Email Invite System",     free: false,          pro: false,          team: true,          category: "Team Exclusive" },
  { feature: "Team Size",          free: false,          pro: false,          team: "5 members",      category: "Team Exclusive" },
];

function Cell({ value, variant }: { value: CellValue; variant: "free" | "pro" | "team" }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={cn(
        "mx-auto h-4 w-4",
        variant === "pro" ? "text-accent" : variant === "team" ? "text-accent" : "text-success"
      )} />
    ) : (
      <X className="mx-auto h-4 w-4 text-text-muted/30" />
    );
  }
  return (
    <span className={cn(
      "text-sm",
      variant === "pro" ? "font-medium text-accent" : variant === "team" ? "font-medium text-accent" : "text-text-muted"
    )}>
      {value}
    </span>
  );
}

export function PricingComparisonTable() {
  let lastCategory = "";

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-4 py-4 text-sm font-medium text-text-muted">Feature</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-text">Free</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-accent">Pro</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-accent">Team</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ feature, free, pro, team, category }, i) => {
            const showCategory = category && category !== lastCategory;
            if (category) lastCategory = category;

            return [
              showCategory ? (
                <tr key={`cat-${category}`} className="bg-surface-2 border-t border-border">
                  <td colSpan={4} className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-text-muted/50">
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
                <td className="px-4 py-3.5 text-sm text-text-muted">{feature}</td>
                <td className="px-4 py-3.5 text-center"><Cell value={free} variant="free" /></td>
                <td className="px-4 py-3.5 text-center"><Cell value={pro} variant="pro" /></td>
                <td className="px-4 py-3.5 text-center"><Cell value={team} variant="team" /></td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
