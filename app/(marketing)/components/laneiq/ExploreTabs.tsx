"use client";

import { useRef, useState } from "react";
import { SectionHead } from "./SectionHead";

export interface ExploreTab {
  key: string;
  label: string;
  /** One line under the label, desktop only: what the reader gets from opening it. */
  hint: string;
  content: React.ReactNode;
}

/**
 * Seven bands the page used to stack one after another, behind one row of tabs.
 *
 * The landing page ran to seventeen sections — eleven screens on a desktop, twenty-three on a
 * phone — and most of that length was these: free tools, the tier list, the daily game, the
 * Academy, the account screens. None of them is dropped. Each band still renders in full,
 * server-side, with its own data and links; only the one on the open tab is shown.
 *
 * Inactive panels stay in the DOM with `hidden` rather than unmounting, so their text is still
 * in the served HTML and a band's server-fetched data is not thrown away on a tab switch.
 *
 * The bands were written as page sections, with their own gutter and top margin. The
 * `[&>section]` overrides take that spacing off inside a panel instead of teaching seven
 * components a second layout.
 *
 * No auto-advance, unlike `ArsenalTabs`: that one rotates so a reader who does not know there
 * is anything to click still sees the pillars. These are things to use, and the first tab —
 * the free tools — is the one worth landing on.
 */
export function ExploreTabs({ tabs }: { tabs: readonly ExploreTab[] }): React.ReactElement {
  const [active, setActive] = useState<number>(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>): void {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = (active + delta + tabs.length) % tabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id="explore" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          title="Try the rest of it"
          aside="Most of it free, no login"
          note="Free tools, a daily game, 61 lessons and the screens behind an account. Pick a tab."
        />

        <div
          role="tablist"
          aria-label="Explore the product"
          onKeyDown={handleKey}
          className="grid grid-cols-2 gap-px border border-border bg-line-1 lg:grid-cols-5"
        >
          {tabs.map((tab, i) => {
            const on = i === active;
            // The 1px dividers are the grid's ground showing through, so an odd tab out in the
            // two-column phone layout left a grey block beside it. It takes the whole row.
            const widen = tabs.length % 2 === 1 && i === tabs.length - 1;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`explore-tab-${tab.key}`}
                aria-selected={on}
                aria-controls={`explore-panel-${tab.key}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                className={`relative px-4 py-3.5 text-left transition-colors duration-[160ms] ease-out ${widen ? "col-span-2 lg:col-span-1" : ""} ${
                  on ? "bg-surface-2" : "bg-background hover:bg-surface-2"
                }`}
              >
                {/* Same 2px edge as the Arsenal rail, laid along the bottom for a row. */}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-[2px] bg-accent transition-opacity duration-[160ms] ${on ? "opacity-100" : "opacity-0"}`}
                />
                <span
                  className={`block font-display text-[12.5px] font-bold uppercase tracking-[0.05em] ${on ? "text-text" : "text-text-muted"}`}
                >
                  {tab.label}
                </span>
                <span className="mt-1 hidden text-[12px] text-text-muted md:block">{tab.hint}</span>
              </button>
            );
          })}
        </div>

        {tabs.map((tab, i) => (
          <div
            key={tab.key}
            role="tabpanel"
            id={`explore-panel-${tab.key}`}
            aria-labelledby={`explore-tab-${tab.key}`}
            hidden={i !== active}
            className="pt-8 [&>section+section]:pt-12 [&>section]:px-0 [&>section]:pt-0"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </section>
  );
}
