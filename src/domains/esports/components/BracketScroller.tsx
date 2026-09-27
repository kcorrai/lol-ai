"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The bracket's horizontal scroller, opened at its right-hand end.
 *
 * A bracket reads left to right, but the rounds a reader came for — the final
 * of a finished one, the next match of a running one — are the last columns,
 * and on anything narrower than the whole bracket they sat off-screen with no
 * sign they were there. So it starts scrolled to the end and says, while there
 * is more to the left, that earlier rounds are one swipe away.
 */
export function BracketScroller({ children }: { children: React.ReactNode }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [hiddenLeft, setHiddenLeft] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollLeft = element.scrollWidth;

    const update = (): void => setHiddenLeft(element.scrollLeft > 4);
    update();
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, []);

  return (
    <div>
      {hiddenLeft && (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-label text-text-muted">
          ← Scroll for earlier rounds
        </p>
      )}
      <div ref={ref} className="overflow-x-auto pb-2">
        {children}
      </div>
    </div>
  );
}
