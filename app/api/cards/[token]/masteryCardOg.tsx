import type { MasteryCardData } from "@/domains/coaching/services/cardService";
import { W, H, C } from "./cardOgTokens";

export function MasteryCard({ d }: { d: MasteryCardData }) {
  const tierColor =
    d.masteryTier === "Legend"
      ? C.gold
      : d.masteryTier === "Master"
      ? C.brand
      : d.masteryTier === "Expert"
      ? C.green
      : C.muted;

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
      }}
    >
      {/* Brand */}
      <span style={{ color: C.brand, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
        LOL AI COACH — CHAMPION MASTERY
      </span>

      <div style={{ display: "flex", marginTop: 32, gap: 48, alignItems: "flex-start" }}>
        {/* Score column */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: C.muted, fontSize: 20 }}>
            {d.gameName}#{d.tagLine}
          </span>
          <span style={{ color: C.text, fontSize: 28, fontWeight: 700, marginTop: 8 }}>
            {d.championName}
          </span>
          <span style={{ color: tierColor, fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            {d.masteryTier}
          </span>

          {/* Progress bar */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.muted, fontSize: 16 }}>Mastery Score</span>
              <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>
                {d.masteryScore}/100
              </span>
            </div>
            <div
              style={{
                display: "flex",
                width: 480,
                height: 16,
                background: C.surface,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${d.masteryScore}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.brandDim}, ${tierColor})`,
                  borderRadius: 8,
                }}
              />
            </div>
          </div>

          <span style={{ color: C.muted, fontSize: 16, marginTop: 24 }}>
            Calculated over {d.gamesPlayed} ranked matches
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
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
