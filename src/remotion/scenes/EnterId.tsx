import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { StepLabel } from "../parts";

const RIOT_ID = "Faker#KR1";

export const EnterId = () => {
  const frame = useCurrentFrame();

  // Type the Riot ID out character by character.
  const typed = Math.min(RIOT_ID.length, Math.floor(interpolate(frame, [10, 60], [0, RIOT_ID.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const analyze = interpolate(frame, [70, 85], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 560 }}>
        <div style={{ marginBottom: 22 }}>
          <StepLabel n={1} text="Enter your Riot ID" />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 14,
            borderRadius: 16,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
          }}
        >
          <span style={{ flex: 1, fontSize: 26, color: COLORS.text }}>
            {RIOT_ID.slice(0, typed)}
            <span style={{ opacity: caretOn ? 1 : 0, color: COLORS.accent }}>|</span>
          </span>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.bg,
              fontSize: 16,
              color: COLORS.muted,
            }}
          >
            KR
          </span>
          <span
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: COLORS.accent,
              color: "#0A0E1A",
              fontSize: 18,
              fontWeight: 800,
              opacity: analyze,
            }}
          >
            Analyze
          </span>
        </div>
        <div style={{ marginTop: 16, textAlign: "center", fontSize: 17, color: COLORS.muted }}>
          No login · results in seconds
        </div>
      </div>
    </AbsoluteFill>
  );
};
