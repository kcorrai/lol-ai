interface FormStripProps {
  /** Newest first, as `recentForm` returns it. */
  form: ("W" | "L")[];
  /** Box size in pixels — 16 in a tile, 22 beside a team's name. */
  size?: number;
  /** Prints the "Form" caption before the squares. */
  labelled?: boolean;
}

/**
 * The last few series, as squares.
 *
 * `form` arrives newest-first. Rendered left to right that reads backwards
 * against every league table people already know, so it is flipped: oldest on
 * the left, the most recent result nearest the end.
 */
export function FormStrip({
  form,
  size = 20,
  labelled = false,
}: FormStripProps): React.ReactElement | null {
  if (form.length === 0) return null;

  const chronological = [...form].reverse();

  return (
    <span
      className="flex items-center gap-1"
      aria-label={`Form, oldest to most recent: ${chronological.join(", ")}`}
    >
      {labelled && <span className="hud-label mr-1">Form</span>}
      {chronological.map((result, index) => (
        <span
          key={index}
          aria-hidden
          className={`grid place-items-center font-mono font-bold leading-none ${
            result === "W" ? "bg-accent text-background" : "border border-danger text-danger"
          }`}
          style={{ width: size, height: size, fontSize: Math.max(9, size * 0.5) }}
        >
          {result}
        </span>
      ))}
    </span>
  );
}
