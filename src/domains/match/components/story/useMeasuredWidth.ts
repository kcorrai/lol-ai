"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The rendered width of an element, in CSS pixels.
 *
 * The story chart uses it to draw its SVG one unit per pixel rather than scaling a fixed viewBox.
 * A fixed one is what the mockup does, and at phone width it shrinks a 9-unit axis label to about
 * three pixels — see the open questions in docs/design/la-52-match-story/README.md. Measuring
 * keeps type at the size it was drawn at, whatever the container is doing.
 */
export function useMeasuredWidth<T extends HTMLElement>(
  fallback: number
): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = (): void => setWidth(el.clientWidth || fallback);
    measure();

    // jsdom has no ResizeObserver. The first measurement is the one that matters there, and a
    // test viewport never resizes, so a missing observer costs nothing rather than throwing.
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fallback]);

  return [ref, width];
}
