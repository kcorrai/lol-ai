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
  { feature: "AI Coaching Reports",       free: "3 / ay",       pro: "Sınırsız",     team: "Sınırsız",    category: "Core" },
  { feature: "Riot Hesabı",               free: "1",            pro: "3",            team: "3",           category: "Core" },
  { feature: "Maç Geçmişi",              free: "10 maç",       pro: "100 maç",      team: "100 maç",     category: "Core" },
  { feature: "Maç Detay Analizi",         free: true,           pro: true,           team: true,          category: "Core" },
  { feature: "Ranked Takibi",             free: true,           pro: true,           team: true,          category: "Core" },
  { feature: "Coach Chat",                free: true,           pro: true,           team: true,          category: "Core" },
  // Tools
  { feature: "Counter Pick",              free: "3 counter",    pro: "Tam liste",    team: "Tam liste",   category: "Araçlar" },
  { feature: "Draft Analyzer",            free: true,           pro: true,           team: true,          category: "Araçlar" },
  { feature: "OTP Asistanı",             free: true,           pro: true,           team: true,          category: "Araçlar" },
  { feature: "Matchup Koçu",             free: "3 / gün",      pro: "Sınırsız",     team: "Sınırsız",    category: "Araçlar" },
  // Pro exclusive
  { feature: "Matchup Intelligence",      free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Champion Mastery Score",    free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Habit Detection Engine",    free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Improvement Tracker",       free: false,          pro: "Tam geçmiş",   team: "Tam geçmiş",  category: "Pro Exclusive" },
  { feature: "Shareable AI Raporlar",     free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Haftalık AI E-posta",       free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Sesli Koçluk (TTS)",        free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  { feature: "Öncelikli AI İşleme",       free: false,          pro: true,           team: true,          category: "Pro Exclusive" },
  // Team exclusive
  { feature: "Takım Yönetimi",            free: false,          pro: false,          team: "5 takıma kadar", category: "Team Exclusive" },
  { feature: "Üye Başına Performans",     free: false,          pro: false,          team: true,          category: "Team Exclusive" },
  { feature: "Coach / Oyuncu Rolleri",    free: false,          pro: false,          team: true,          category: "Team Exclusive" },
  { feature: "E-posta Davet Sistemi",     free: false,          pro: false,          team: true,          category: "Team Exclusive" },
  { feature: "Takım Büyüklüğü",          free: false,          pro: false,          team: "5 kişi",      category: "Team Exclusive" },
];

function Cell({ value, variant }: { value: CellValue; variant: "free" | "pro" | "team" }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={cn(
        "mx-auto h-4 w-4",
        variant === "pro" ? "text-accent" : variant === "team" ? "text-warning" : "text-success"
      )} />
    ) : (
      <X className="mx-auto h-4 w-4 text-text-muted/30" />
    );
  }
  return (
    <span className={cn(
      "text-sm",
      variant === "pro" ? "font-medium text-accent" : variant === "team" ? "font-medium text-warning" : "text-text-muted"
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
            <th className="px-4 py-4 text-sm font-medium text-text-muted">Özellik</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-text">Free</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-accent">Pro</th>
            <th className="px-4 py-4 text-center text-sm font-bold text-warning">Team</th>
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
