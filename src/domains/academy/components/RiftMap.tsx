/**
 * Summoner's Rift as a schematic, drawn rather than downloaded. Riot's minimap art is theirs,
 * and a screenshot is the wrong picture anyway: what a vision lesson teaches is a shape — the
 * lane, the river between you and them, the two pits worth fighting over. Everything is in a
 * 0–100 box so a drill can place a spot with fractions and never think about pixels.
 *
 * Blue side sits bottom left and red side top right, the way every map in the game reads.
 */
export function RiftMap(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width="100" height="100" rx="3" fill="var(--ink-700)" />

      {/* Halves, split along the river: yours below the diagonal, theirs above it. */}
      <polygon points="0,0 100,0 100,100" fill="var(--red-500)" opacity="0.05" />
      <polygon points="0,0 0,100 100,100" fill="var(--blue-500)" opacity="0.05" />

      {/* River — the diagonal both teams have to cross to reach each other. */}
      <line
        x1="4"
        y1="4"
        x2="96"
        y2="96"
        stroke="var(--teal-500)"
        strokeOpacity="0.16"
        strokeWidth="13"
        strokeLinecap="round"
      />

      <g stroke="var(--line-3)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top lane: up the left edge, then across the top. */}
        <path d="M 9 78 L 9 15 Q 9 9 15 9 L 78 9" />
        {/* Bot lane: along the bottom, then up the right edge. */}
        <path d="M 22 91 L 85 91 Q 91 91 91 85 L 91 22" />
        {/* Mid. */}
        <path d="M 16 84 L 84 16" />
      </g>

      {/* Bases. */}
      <circle cx="7" cy="93" r="7" fill="var(--blue-500)" opacity="0.5" />
      <circle cx="93" cy="7" r="7" fill="var(--red-500)" opacity="0.5" />

      {/* Pits. Baron above the river, dragon below it — the two reasons a team crosses. */}
      <g fill="var(--ink-800)" stroke="var(--line-3)" strokeWidth="1.2">
        <circle cx="34" cy="27" r="6" />
        <circle cx="69" cy="75" r="6" />
      </g>
      <g
        fill="var(--fg-3)"
        fontSize="4.2"
        fontFamily="var(--font-mono, monospace)"
        textAnchor="middle"
        letterSpacing="0.3"
      >
        <text x="34" y="28.6">
          BARON
        </text>
        <text x="69" y="76.6">
          DRAKE
        </text>
      </g>
    </svg>
  );
}
