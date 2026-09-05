import { Illustration } from "../desktop/chrome";
import { Card, Portrait, Rail, Track, Window, type RailGroup } from "./screenChrome";

/**
 * The dashboard, drawn.
 *
 * `app/(app)/dashboard/PageClient.tsx` stacks three layers — decision, analysis, archive —
 * and only the first is here. The decision layer is what the screen is for: it answers
 * "should I queue right now", and a picture that also showed ten trend charts would be a
 * picture of a busy page rather than of that answer.
 *
 * The quest strip above it is drawn because it is the first thing on the real screen and the
 * only part that is a habit rather than a readout.
 */

/** `src/components/layout/navConfig.ts`, down to the group the drawn body belongs to. */
const RAIL: readonly RailGroup[] = [
  { group: "Overview", items: ["Dashboard"] },
  { group: "Coaching", items: ["Reports", "Coach Chat", "Improvement", "OTP Assistant"] },
  { group: "My Performance", items: ["Champions", "Heat Map", "Career Timeline"] },
];

/** `LastGameColumn`'s four readings, in its order. */
const LAST_GAME: readonly { label: string; value: string }[] = [
  { label: "CS / min", value: "6.4" },
  { label: "Vision", value: "41" },
  { label: "Gold / min", value: "497" },
  { label: "DMG share", value: "28%" },
];

export function DashboardScreen(): React.ReactElement {
  return (
    <Illustration
      label="The dashboard drawn as an illustration: a navigation rail, today's quest, and three columns — session readiness with a score out of a hundred, today's focus, and the last game graded."
      caption="// Illustration — the dashboard's own panels, drawn"
    >
      <Window name="Dashboard" meta="Free">
        <div className="grid grid-cols-[128px_1fr] md:grid-cols-[152px_1fr]">
          <Rail groups={RAIL} current="Dashboard" className="hidden sm:block" />

          <div className="col-span-2 grid gap-2.5 p-3 sm:col-span-1 md:gap-3 md:p-4">
            {/* Today's quest. A single line on the real screen too — it is a nudge, not a
                panel, so it gets a rule of its own rather than a card. */}
            <div className="notch-sm flex flex-wrap items-center gap-x-3 gap-y-1.5 border border-line-1 bg-surface px-3 py-2.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted">
                {"// Today's quest"}
              </span>
              <span className="text-[11.5px] text-text">Finish an Academy lesson</span>
              <span className="ml-auto font-mono text-[10px] text-accent">+30 XP</span>
            </div>

            <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
              {/* Readiness. The score is the loudest thing on the real screen and the
                  accent's rationing rule (ADR-015) says it is allowed to be. */}
              <Card label="Session readiness">
                <p className="font-display text-[30px] font-extrabold leading-none text-accent">
                  70
                  <span className="ml-1 font-mono text-[11px] font-normal text-text-faint">
                    /100
                  </span>
                </p>
                <p className="mt-1.5 font-display text-[12px] font-bold uppercase tracking-[0.05em] text-text">
                  Ready to queue
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-text-muted">
                  You&apos;re dialed in. Good time to climb.
                </p>
                <div className="mt-3 grid gap-2">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                        Mental
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
                        Focused
                      </span>
                    </div>
                    <Track value={82} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                        Warm-up
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
                        Cold
                      </span>
                    </div>
                    <Track value={14} tone="danger" className="mt-1" />
                  </div>
                </div>
              </Card>

              {/* Today's focus. One habit, with what it is worth and how long it takes —
                  the three things `FocusColumn` renders. */}
              <Card label="Today's focus">
                <p className="text-[12.5px] leading-relaxed text-text">
                  Ward the pit 45s before spawn, not at spawn.
                </p>
                <div className="mt-3 grid gap-2 border-t border-line-1 pt-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                      Expected
                    </span>
                    <span className="font-mono text-[11px] font-bold text-accent">+6 LP</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                      Timeframe
                    </span>
                    <span className="font-mono text-[11px] text-text-body">3 games</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                      Vision / min
                    </span>
                    <span className="font-mono text-[11px] text-text-body">1.14</span>
                  </div>
                </div>
              </Card>

              <Card label="Last game" meta="Victory">
                <div className="flex items-center gap-2">
                  <Portrait size={22} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-[12px] font-bold uppercase tracking-[0.05em] text-text">
                      Ahri · Mid
                    </p>
                    <p className="font-mono text-[9.5px] text-text-muted">7/2/14 · KDA 10.50</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line-1 pt-2.5">
                  {LAST_GAME.map((s) => (
                    <div key={s.label}>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-text-faint">
                        {s.label}
                      </p>
                      <p className="font-mono text-[12px] font-bold tabular-nums text-text">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Window>
    </Illustration>
  );
}
