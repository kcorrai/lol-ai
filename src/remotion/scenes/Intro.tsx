import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

export const Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const y = interpolate(enter, [0, 1], [24, 0]);
  const subtitle = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: enter, transform: `translateY(${y}px)`, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            marginBottom: 20,
            padding: "6px 16px",
            borderRadius: 999,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: COLORS.accent,
          }}
        >
          LoL AI Coach
        </div>
        <div style={{ fontSize: 58, fontWeight: 800, color: COLORS.text, lineHeight: 1.1 }}>
          From Riot ID to a <span style={{ color: COLORS.accent }}>climb plan</span>
        </div>
        <div style={{ marginTop: 18, fontSize: 24, color: COLORS.muted, opacity: subtitle }}>
          Watch how one session turns into specific, personal coaching.
        </div>
      </div>
    </AbsoluteFill>
  );
};
