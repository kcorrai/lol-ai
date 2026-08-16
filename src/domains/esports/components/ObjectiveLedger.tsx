import { objectiveEvents, sampleClock } from "@/domains/esports/timeline";
import type { ObjectiveEvent, ObjectiveKind } from "@/domains/esports/timeline";
import type { GameTimeline } from "@/domains/esports/types";

/**
 * Objectives as the walk saw them fall.
 *
 * Every row reads "by 12:00", never "at 12:00", and that is not politeness: the
 * walk samples the game every few minutes, so it knows a baron was taken inside
 * a window and not when in it. Saying "at" would be a precision the data does
 * not have.
 */

const LABEL: Record<ObjectiveKind, { one: string; many: string }> = {
  tower: { one: "tower", many: "towers" },
  inhibitor: { one: "inhibitor", many: "inhibitors" },
  dragon: { one: "dragon", many: "dragons" },
  baron: { one: "baron", many: "barons" },
};

function describe(event: ObjectiveEvent): string {
  const label = LABEL[event.kind];
  return `${event.count} ${event.count === 1 ? label.one : label.many}`;
}

/** Events sharing a sample, in the order the game is read: objectives then time. */
function byWindow(events: ObjectiveEvent[]): { seconds: number; events: ObjectiveEvent[] }[] {
  const windows = new Map<number, ObjectiveEvent[]>();
  for (const event of events) {
    const list = windows.get(event.seconds) ?? [];
    list.push(event);
    windows.set(event.seconds, list);
  }

  return [...windows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([seconds, list]) => ({ seconds, events: list }));
}

export function ObjectiveLedger({
  timeline,
  blueName,
  redName,
}: {
  timeline: GameTimeline;
  blueName: string;
  redName: string;
}): React.ReactElement | null {
  const windows = byWindow(objectiveEvents(timeline));
  if (windows.length === 0) return null;

  return (
    <div className="gaming-card notch-sm overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <caption className="sr-only">
          Objectives taken, grouped by the sampling window they were first seen in
        </caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="hud-label px-3 py-2 font-normal">
              By
            </th>
            <th scope="col" className="hud-label px-3 py-2 font-normal">
              {blueName}
            </th>
            <th scope="col" className="hud-label px-3 py-2 font-normal">
              {redName}
            </th>
          </tr>
        </thead>
        <tbody>
          {windows.map((window) => (
            <tr key={window.seconds} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 font-mono text-text-muted">{sampleClock(window.seconds)}</td>
              {(["blue", "red"] as const).map((side) => {
                const taken = window.events.filter((event) => event.side === side);
                return (
                  <td
                    key={side}
                    className={`px-3 py-2 ${
                      side === "blue" ? "text-accent-blue" : "text-danger"
                    } ${taken.length === 0 ? "text-text-faint" : ""}`}
                  >
                    {taken.length === 0 ? "—" : taken.map(describe).join(", ")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
