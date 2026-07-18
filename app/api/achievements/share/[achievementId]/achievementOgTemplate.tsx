import { ACHIEVEMENT_CATALOG, TIER_COLORS } from "@/types/achievement";

type Achievement = (typeof ACHIEVEMENT_CATALOG)[number];

export function AchievementOgCard({
  achievement,
  gameName,
}: {
  achievement: Achievement;
  gameName: string;
}) {
  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "800px",
        height: "420px",
        background: "#0A0E1A",
        fontFamily: "system-ui, sans-serif",
        gap: "0px",
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: tierColor }} />

      {/* Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "96px",
          height: "96px",
          borderRadius: "50%",
          background: `${tierColor}22`,
          border: `3px solid ${tierColor}`,
          fontSize: "44px",
          marginBottom: "20px",
        }}
      >
        {achievement.iconSlug}
      </div>

      {/* Tier pill */}
      <div
        style={{
          display: "flex",
          background: `${tierColor}33`,
          border: `1px solid ${tierColor}66`,
          color: tierColor,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "4px 12px",
          borderRadius: "9999px",
          marginBottom: "12px",
        }}
      >
        {achievement.tier}
      </div>

      {/* Achievement name */}
      <div
        style={{
          fontSize: "36px",
          fontWeight: 800,
          color: "#E8F0FF",
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        {achievement.name}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "16px",
          color: "#8899BB",
          marginBottom: "24px",
          textAlign: "center",
          maxWidth: "480px",
        }}
      >
        {achievement.description}
      </div>

      {/* Player name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#0F1629",
          border: "1px solid #2A3550",
          borderRadius: "8px",
          padding: "8px 20px",
        }}
      >
        <span style={{ color: "#8899BB", fontSize: "13px" }}>Kazanan:</span>
        <span style={{ color: "#E8F0FF", fontSize: "15px", fontWeight: 600 }}>{gameName}</span>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span style={{ color: "#4A5568", fontSize: "12px" }}>lolaicoach.gg</span>
      </div>
    </div>
  );
}
