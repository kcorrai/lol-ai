import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { champSquare } from "../theme";
import { StepLabel } from "../parts";

const MATCHES = [
  { champ: "Yasuo", role: "Mid", win: true, k: 14, d: 3, a: 9, cs: 251 },
  { champ: "Ahri", role: "Mid", win: true, k: 9, d: 2, a: 16, cs: 214 },
  { champ: "Zed", role: "Mid", win: false, k: 7, d: 8, a: 5, cs: 223 },
  { champ: "LeeSin", role: "Jungle", win: true, k: 8, d: 4, a: 18, cs: 168 },
];

const Row = ({ m, index }: { m: (typeof MATCHES)[number]; index: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 20 + index * 14;
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const x = interpolate(enter, [0, 1], [-24, 0]);
  const kda = ((m.k + m.a) / Math.max(m.d, 1)).toFixed(1);
  const accent = m.win ? COLORS.success : COLORS.danger;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 12,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${accent}`,
        background: COLORS.surface,
        opacity: enter,
        transform: `translateX(${x}px)`,
      }}
    >
      <Img src={champSquare(m.champ)} style={{ width: 42, height: 42, borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{m.champ}</div>
        <div style={{ fontSize: 14, color: COLORS.muted }}>{m.role}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>
          {m.k}/{m.d}/{m.a}
        </div>
        <div style={{ fontSize: 14, color: COLORS.muted }}>
          {kda} KDA · {m.cs} CS
        </div>
      </div>
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 800,
          color: accent,
          background: m.win ? "rgba(82,183,136,0.15)" : "rgba(230,57,70,0.15)",
        }}
      >
        {m.win ? "WIN" : "LOSS"}
      </span>
    </div>
  );
};

export const ScanMatches = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [20, 120], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 620 }}>
        <div style={{ marginBottom: 18 }}>
          <StepLabel n={2} text="AI scans your last 20 ranked matches" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MATCHES.map((m, i) => (
            <Row key={m.champ} m={m} index={i} />
          ))}
        </div>
        <div
          style={{
            marginTop: 18,
            height: 6,
            width: "100%",
            borderRadius: 999,
            overflow: "hidden",
            background: COLORS.surface2,
          }}
        >
          <div style={{ height: "100%", width: `${progress}%`, background: COLORS.accent }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
