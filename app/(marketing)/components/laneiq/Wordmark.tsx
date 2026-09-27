// No mark exists for the product, so the wordmark is type-set: Orbitron 800,
// uppercase, with the accent on "IQ" — the half of the name that is the product's claim
// (ADR-015 rations the accent to one token).
export function Wordmark({ size = 21 }: { size?: number }): React.ReactElement {
  return (
    <span
      className="whitespace-nowrap font-display font-extrabold uppercase tracking-[0.06em] text-text"
      style={{ fontSize: size }}
    >
      Lane<span className="text-accent">IQ</span>
    </span>
  );
}
