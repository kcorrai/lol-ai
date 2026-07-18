import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { StepLabel } from "../parts";

const Pill = ({ label, sub }: { label: string; sub: string }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{label}</div>
    <div style={{ fontSize: 13, color: COLORS.muted }}>{sub}</div>
  </div>
);

const List = ({
  title,
  color,
  items,
}: {
  title: string;
  color: string;
  items: string[];
}) => (
  <div
    style={{
      flex: 1,
      padding: 14,
      borderRadius: 12,
      border: `1px solid ${color}44`,
      background: `${color}0D`,
    }}
  >
    <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color }}>
      {title}
    </div>
    {items.map((it) => (
      <div key={it} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
        <span style={{ fontSize: 16, color: COLORS.muted }}>{it}</span>
      </div>
    ))}
  </div>
);

export const Report = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(enter, [0, 1], [0.94, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 640, opacity: enter, transform: `scale(${scale})` }}>
        <div style={{ marginBottom: 18 }}>
          <StepLabel n={3} text="Get your coaching report" />
        </div>
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 16 }}>
            <Pill label="8" sub="Matches" />
            <Pill label="Gold II" sub="Potential" />
            <Pill label="23s" sub="AI Time" />
          </div>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              border: `1px solid ${COLORS.accent}55`,
              background: "rgba(200,155,60,0.06)",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: COLORS.accent }}>
              Coach Says
            </div>
            <div style={{ marginTop: 6, fontSize: 16, fontStyle: "italic", lineHeight: 1.5, color: COLORS.muted }}>
              &ldquo;Your wave management is the reason you&apos;re losing lanes you should win. Fix your freeze before the next climb.&rdquo;
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <List title="Strengths" color={COLORS.success} items={["Roaming", "Team fights"]} />
            <List title="Weaknesses" color={COLORS.danger} items={["Wave control", "Vision"]} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
