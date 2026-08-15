"use client";

import { Sparkles, TrendingUp, TrendingDown, Lightbulb, Star, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TeamReportData } from "@/domains/teams/services/teamReportService";

function Section({ icon: Icon, title, items, color }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <p className="text-sm font-bold text-text">{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
            <span className={cn("mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full", color.replace("text-", "bg-"))} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface TeamReportCardProps {
  report: TeamReportData;
  onRegenerate: () => void;
  isRegenerating: boolean;
  isCoach: boolean;
}

export function TeamReportCard({ report, onRegenerate, isRegenerating, isCoach }: TeamReportCardProps) {
  const generatedAt = new Date(report.generatedAt).toLocaleDateString("en-US", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-info" />
            <p className="text-xs font-bold uppercase tracking-wider text-info">Team AI Report</p>
          </div>
          <p className="text-xs text-text-muted">Generated on {generatedAt}</p>
        </div>
        {isCoach && (
          <Button size="sm" variant="ghost" onClick={onRegenerate} disabled={isRegenerating}
            className="shrink-0 gap-1.5 text-text-muted hover:text-text">
            <RefreshCw className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")} />
            Refresh
          </Button>
        )}
      </div>

      {/* Overview */}
      <div className="rounded-xl border border-info/20 bg-info/5 p-4">
        <p className="text-sm leading-relaxed text-text">{report.overview}</p>
      </div>

      {/* MVP + Focus */}
      {(report.mvp ?? report.focusPlayer) && (
        <div className="grid grid-cols-2 gap-3">
          {report.mvp && (
            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2">
              <Star className="h-4 w-4 shrink-0 text-success" />
              <div>
                <p className="text-[10px] font-bold uppercase text-success/70">MVP</p>
                <p className="text-sm font-semibold text-text">{report.mvp}</p>
              </div>
            </div>
          )}
          {report.focusPlayer && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
              <Target className="h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="text-[10px] font-bold uppercase text-warning/70">Focus Player</p>
                <p className="text-sm font-semibold text-text">{report.focusPlayer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strengths / Weaknesses */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Section icon={TrendingUp} title="Strengths" items={report.strengths} color="text-success" />
        <Section icon={TrendingDown} title="Weaknesses" items={report.weaknesses} color="text-danger" />
      </div>

      {/* Recommendations */}
      <Section icon={Lightbulb} title="Recommendations" items={report.recommendations} color="text-info" />

      {/* Member Highlights */}
      {report.memberHighlights.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-3 text-sm font-bold text-text">Member Notes</p>
          <div className="space-y-2">
            {report.memberHighlights.map((h, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="shrink-0 font-semibold text-text">{h.gameName}:</span>
                <span className="text-text-muted">{h.insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
