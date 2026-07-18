import { COLORS } from "./theme";

export const StepLabel = ({ n, text }: { n: number; text: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <span
      style={{
        display: "flex",
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        background: COLORS.accent,
        color: "#0A0E1A",
        fontWeight: 800,
        fontSize: 18,
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{text}</span>
  </div>
);
