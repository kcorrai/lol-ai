"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useEsportsPrefsStore } from "@/lib/stores/esportsPrefsStore";
import { HIDE_SCORES_ATTRIBUTE } from "@/domains/esports/spoilerScript";

const ATTRIBUTE = HIDE_SCORES_ATTRIBUTE;

/**
 * A click on a hidden result reveals that result — and only that one.
 *
 * The result may sit inside a link to its match, so the click is stopped before
 * it navigates: the reader asked to see a score, not to open the page.
 */
export function revealOnClick(event: MouseEvent): void {
  if (document.documentElement.getAttribute(ATTRIBUTE) !== "true") return;
  const target = event.target instanceof Element ? event.target : null;

  // A SpoilerBlock's button opens the block it stands in for.
  const reveal = target?.closest("[data-spoiler-reveal]");
  if (reveal) {
    reveal
      .closest("[data-spoiler-placeholder]")
      ?.previousElementSibling?.setAttribute("data-revealed", "");
    return;
  }
  const hidden = target?.closest("[data-spoiler]:not([data-revealed] *, [data-revealed])");
  if (!hidden) return;

  event.preventDefault();
  event.stopPropagation();
  (hidden.closest("[data-spoiler-scope]") ?? hidden).setAttribute("data-revealed", "");
}

/**
 * The "hide scores" switch. Hides series scores, winners, recent form and a
 * match page's game stats; standings stay visible, since a league page without
 * its table has nothing left to say.
 */
export function SpoilerToggle(): React.ReactElement {
  const hideScores = useEsportsPrefsStore((state) => state.hideScores);
  const setHideScores = useEsportsPrefsStore((state) => state.setHideScores);

  // Until the saved preference is read, the store holds its default — and
  // acting on that would strip the attribute the pre-paint script set, flashing
  // every score for a frame.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void Promise.resolve(useEsportsPrefsStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (hideScores) {
      root.setAttribute(ATTRIBUTE, "true");
    } else {
      root.removeAttribute(ATTRIBUTE);
      // Whatever was revealed one by one is moot once everything is shown.
      document
        .querySelectorAll("[data-revealed]")
        .forEach((element) => element.removeAttribute("data-revealed"));
    }
  }, [hideScores, hydrated]);

  useEffect(() => {
    document.addEventListener("click", revealOnClick, true);
    return () => document.removeEventListener("click", revealOnClick, true);
  }, []);

  const Icon = hideScores ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={() => setHideScores(!hideScores)}
      aria-pressed={hideScores}
      title="Hide series scores, winners, recent form and game stats until you click them. Standings stay visible."
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
        hideScores ? "border-accent text-accent" : "border-border text-text-muted hover:text-text"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">{hideScores ? "Scores hidden" : "Hide scores"}</span>
    </button>
  );
}
