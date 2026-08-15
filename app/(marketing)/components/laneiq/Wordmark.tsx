// No mark exists for the product, so the wordmark is type-set: Orbitron 800,
// uppercase, with the middle token carrying the accent (ADR-015).
export function Wordmark({ size = 17 }: { size?: number }): React.ReactElement {
  return (
    <span
      className="whitespace-nowrap font-display font-extrabold uppercase tracking-[0.06em] text-text"
      style={{ fontSize: size }}
    >
      LoL <span className="text-accent">AI</span> Coach
    </span>
  );
}
