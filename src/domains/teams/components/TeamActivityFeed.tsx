"use client";

import { UserPlus, UserMinus, Activity, Loader2 } from "lucide-react";
import { useTeamActivity } from "@/hooks/useTeamActivity";

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  member_joined:  { label: "katıldı",      icon: UserPlus,   color: "text-success" },
  member_removed: { label: "çıkarıldı",    icon: UserMinus,  color: "text-danger"  },
  default:        { label: "",             icon: Activity,   color: "text-text-muted" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s önce`;
  return `${Math.floor(h / 24)}g önce`;
}

interface Props {
  teamId: string;
}

export function TeamActivityFeed({ teamId }: Props) {
  const { data: activities, isLoading } = useTeamActivity(teamId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Yükleniyor…</span>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center">
        <Activity className="mx-auto mb-2 h-7 w-7 text-text-muted/30" />
        <p className="text-sm text-text-muted">Henüz aktivite yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 rounded-xl border border-border bg-surface overflow-hidden">
      {activities.map((item, idx) => {
        const meta = ACTION_META[item.action] ?? ACTION_META.default;
        const Icon = meta.icon;

        return (
          <div
            key={item.id}
            className={`flex items-start gap-3 px-4 py-3 ${idx < activities.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 ${meta.color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-text">
                <span className="font-semibold">{item.actorName}</span>
                {meta.label && <span className="text-text-muted"> {meta.label}</span>}
                {item.detail && <span className="text-text-muted/70"> · {item.detail}</span>}
              </p>
              <p className="text-[11px] text-text-muted/50">{relativeTime(item.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
