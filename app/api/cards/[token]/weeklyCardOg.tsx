import type { WeeklyCardData } from "@/domains/coaching/services/cardService";
import { W, H, C } from "./cardOgTokens";

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ color: C.muted, fontSize: 16 }}>{label}</span>
      <span style={{ color, fontSize: 40, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

export function WeeklyCard({ d }: { d: WeeklyCardData }) {
  const lpColor = d.lpDelta >= 0 ? C.green : C.red;
  const lpSign = d.lpDelta >= 0 ? "+" : "";

  return (
    <div
      style={{
        width: W,
        height: H,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: C.brand, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            LOL AI COACH
          </span>
          <span style={{ color: C.text, fontSize: 32, fontWeight: 800, marginTop: 4 }}>
            {d.gameName}
            <span style={{ color: C.muted, fontWeight: 400, fontSize: 24 }}>#{d.tagLine}</span>
          </span>
        </div>
        <span style={{ color: C.muted, fontSize: 16 }}>This Week</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, margin: "32px 0" }} />

      {/* Stats row */}
      <div style={{ display: "flex", gap: 48 }}>
        <StatBox label="LP Change" value={`${lpSign}${d.lpDelta}`} color={lpColor} />
        <StatBox label="Win Rate" value={`${d.winRate}%`} color={C.text} />
        <StatBox label="Games" value={`${d.gamesPlayed} Matches`} color={C.muted} />
        {d.coachGrade && (
          <StatBox label="AI Coach Notu" value={d.coachGrade} color={C.gold} />
        )}
      </div>

      {/* Best champion */}
      {d.bestChampionName !== "-" && (
        <div
          style={{
            marginTop: 40,
            padding: "20px 24px",
            background: C.surface,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <span style={{ color: C.muted, fontSize: 18 }}>Best Champion</span>
          <span style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>
            {d.bestChampionName}
          </span>
          <span style={{ color: C.green, fontSize: 20 }}>{d.bestChampionWinRate}% WR</span>
          {d.masteryScore !== null && (
            <span style={{ color: C.brand, fontSize: 18 }}>
              Mastery {d.masteryScore}/100
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: C.muted, fontSize: 16 }}>lolaicoach.com</span>
        {!d.isPro && (
          <span style={{ color: C.brandDim, fontSize: 14 }}>Made with LoL AI Coach</span>
        )}
      </div>
    </div>
  );
}
