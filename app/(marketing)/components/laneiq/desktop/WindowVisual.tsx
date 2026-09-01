import { Zap } from "lucide-react";
import { Chip, Illustration, Panel, Stat } from "./chrome";
import { BLUE, EVENTS, RAIL, RED, Side } from "./windowParts";

/**
 * The window itself, which is the half of the application a player spends time in.
 *
 * `desktop/src/components/layout/AppFrame.tsx` is three pieces — a sidebar, a status bar, the
 * screen — and the sidebar is the website's own, in the same two widths. The section headings
 * and the item labels are read off `desktop/src/routes.tsx` rather than written for this
 * picture, because the point of that sidebar is that the two products call things by the same
 * names, and an illustration that renamed them would be arguing the opposite.
 *
 * The screen drawn in it is `/game`: both teams, what has been taken, the plan, and what has
 * happened. Nothing counts down — see the note on `EVENTS`.
 */
export function WindowVisual(): React.ReactElement {
  return (
    <Illustration
      label="The companion's main window: the website's sidebar down the left, a status bar across the top, and the live game screen showing both teams, the objectives taken, the game plan and what has happened so far."
      caption="// Illustration — the window's own sidebar and screens, drawn"
    >
      <div className="notch-lg overflow-hidden border border-border bg-background">
        <div className="flex">
          {/* The sidebar in its labelled width. It ships collapsed to 56px of icons — every
              pixel it takes is one not spent on the game — and opens when the player asks. */}
          <aside
            className="hidden w-[188px] shrink-0 flex-col border-r border-white/5 sm:flex"
            style={{ background: "linear-gradient(180deg, #08091280 0%, #050706 100%)" }}
          >
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/5 px-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
                <Zap className="h-3.5 w-3.5 text-accent" aria-hidden />
              </span>
              <span className="truncate font-display text-[12px] font-bold tracking-wide text-text">
                LoL AI&nbsp;<span className="text-accent">Coach</span>
              </span>
            </div>

            <div className="p-2">
              {RAIL.map((section) => (
                <div key={section.group}>
                  <p className="px-2 pb-1 pt-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-text-faint">
                    {section.group}
                  </p>
                  {section.items.map((item, i) => (
                    <span
                      key={item.label}
                      className={`flex items-center gap-2.5 px-2 py-[7px] text-[11.5px] ${
                        section.group === "This game" && i === 0
                          ? "bg-accent/10 text-accent"
                          : "text-text-muted"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* What changes while the window is open: whose games are on screen, and whether a
                game is running. The player search and the avatar menu stay on the website —
                both assume a browser tab's worth of room. */}
            <header className="flex h-10 shrink-0 items-center justify-end gap-2 border-b border-line-1 bg-surface-dark px-3">
              <Chip>Kayjay#EUW</Chip>
              <Chip tone="accent">Game running</Chip>
            </header>

            <div className="grid min-w-0 flex-1 gap-3 p-3 lg:grid-cols-[1.25fr_1fr]">
              <div className="grid min-w-0 content-start gap-3">
                <div className="notch overflow-hidden border border-border bg-surface">
                  <div className="grid sm:grid-cols-2">
                    <Side
                      team="Blue"
                      kills="14"
                      rows={BLUE}
                      className="border-b border-line-1 sm:border-b-0 sm:border-r"
                    />
                    <Side team="Red" kills="9" rows={RED} />
                  </div>
                </div>

                <Panel title="Objectives" meta="Taken so far">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <Stat label="Dragons" value="2 – 1" tone="accent" />
                    <Stat label="Heralds" value="1 – 0" tone="accent" />
                    <Stat label="Barons" value="0 – 0" tone="neutral" />
                    <Stat label="Turrets" value="4 – 2" tone="accent" />
                  </div>
                </Panel>
              </div>

              <div className="grid min-w-0 content-start gap-3">
                <Panel title="Game plan" meta="Deterministic · no model">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-faint">
                    Playing the matchup
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-text-body">
                    He wins an even all-in past level 2. Trade on his cooldown, not on yours.
                  </p>
                  <p className="mt-3.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-faint">
                    Watch for
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-text-body">
                    You give up the 20 seconds after a reset in 7 of your last 10 games.
                  </p>
                </Panel>

                <Panel title="So far this game" meta="Newest first">
                  <div className="grid gap-2">
                    {EVENTS.map((event) => (
                      <div key={event.at} className="flex items-baseline gap-3">
                        <span className="w-10 shrink-0 font-mono text-[10.5px] tabular-nums text-text-faint">
                          {event.at}
                        </span>
                        <span
                          className={`min-w-0 flex-1 truncate text-[11.5px] ${
                            event.mine ? "text-text-body" : "text-text-muted"
                          }`}
                        >
                          {event.what}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Illustration>
  );
}
