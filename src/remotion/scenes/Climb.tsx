import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

const BARS = [38, 52, 47, 63, 71, 84, 92];

export const Climb = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 620 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>Ranked climb</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.success }}>
            Silver II → Gold IV · +180 LP
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            height: 240,
            padding: 20,
            borderRadius: 16,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
          }}
        >
          {BARS.map((h, i) => {
            const grow = interpolate(frame, [i * 3, i * 3 + 14], [0, h], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${grow}%`,
                  borderRadius: "6px 6px 0 0",
                  background: `linear-gradient(to top, ${COLORS.accent}66, ${COLORS.accent})`,
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
