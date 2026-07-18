// CSS-only confetti burst rendered on mount. Extracted from the retired DashboardOnboarding
// so the coach tour finale and any future celebration can share it.
const COLORS = ["#C89B3C", "#4ADE80", "#60A5FA", "#F472B6", "#A78BFA"];

export function Confetti(): React.JSX.Element {
  const pieces = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => {
        const color = COLORS[i % COLORS.length];
        const left = `${4 + (i * 4) % 92}%`;
        const delay = `${(i * 120) % 800}ms`;
        const duration = `${700 + (i * 80) % 600}ms`;
        return (
          <div
            key={i}
            style={{ left, color, animationDelay: delay, animationDuration: duration }}
            className="absolute top-0 animate-[confetti-fall_0.8s_ease-in_forwards] text-sm"
          >
            {i % 3 === 0 ? "■" : i % 3 === 1 ? "●" : "▲"}
          </div>
        );
      })}
    </div>
  );
}
