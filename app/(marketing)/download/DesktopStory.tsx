import Link from "next/link";
import { SectionHead } from "../components/laneiq/SectionHead";
import { HudStagger, HudStaggerItem } from "../components/laneiq/motion";

/**
 * What the companion does and what it costs you to set up.
 *
 * Every claim here is taken from `desktop/README.md` and the IPC surface it documents, not
 * from what a companion app usually does. Two of them are limitations rather than features
 * — the borderless requirement and the absence of champion select — and they are on the
 * page for the same reason the rest is: a player who finds out afterwards concludes the
 * whole list was written by somebody who had not used it.
 */

interface Item {
  title: string;
  body: string;
}

const DOES: readonly Item[] = [
  {
    title: "Reads the game while you are in it",
    body: "Riot's Live Client Data API only listens on your own machine, at 127.0.0.1:2999. That is the entire reason this application exists — no website, ours included, can reach it.",
  },
  {
    title: "This lane, as it is going",
    body: "How the matchup goes for everyone on this patch, kept separate from how it has gone for you. A personal record always carries its sample size, because over three games a win rate is a story about three games.",
  },
  {
    title: "A game plan that calls no model",
    body: "How the matchup is played and what you keep doing wrong regardless. Both readings are deterministic, so they arrive in the minute you cannot spare and can be checked against the data behind them.",
  },
  {
    title: "So far this game",
    body: "The objectives taken and when, the turrets down, the kills and which were yours. It counts nothing down: respawn timers move between patches and a confidently wrong countdown is worse than no panel.",
  },
  {
    title: "An overlay you can dismiss",
    body: "Ctrl+Alt+L, or your own combination. It never takes focus, and you set the screen, the corner, the margin, which panels it draws and how solid they are.",
  },
  {
    title: "Before the game, by hand",
    body: "Name the two champions and the lane on /pregame and get the same reading a minute early. Champion select itself needs an interface the app is not allowed to touch, so it asks you instead of pretending.",
  },
  {
    title: "It tells us your game ended",
    body: "A server only learns a match is over when somebody opens the dashboard. This window knows to the second, so the pull starts immediately and the full report is waiting.",
  },
  {
    title: "The screens worth having beside a game",
    body: "Your dashboard, reports, champion pool, match search, heat map, career timeline, season recap, milestone and leaderboard, drawn in the window rather than sending you to a browser.",
  },
];

const PAIRING: readonly Item[] = [
  {
    title: "Press one button",
    body: "The app asks the website to open a pairing request and sends your browser to the page that approves it.",
  },
  {
    title: "Approve the machine",
    body: "The page names the computer asking. Approve it only if it is the one you just pressed the button on.",
  },
  {
    title: "That is the whole of it",
    body: "The window fills in about two seconds later. Your password never enters the application — the machine holds a token for itself, in your operating system's credential store.",
  },
];

function Numbered({ items }: { items: readonly Item[] }): React.ReactElement {
  return (
    <HudStagger className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <HudStaggerItem key={item.title}>
          <div className="notch h-full border border-border bg-surface p-5">
            <span className="font-mono text-[10.5px] text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-2 font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
              {item.title}
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-text-muted">{item.body}</p>
          </div>
        </HudStaggerItem>
      ))}
    </HudStagger>
  );
}

export function DesktopStory(): React.ReactElement {
  return (
    <>
      <section className="px-5 pt-16 md:px-8 md:pt-[72px]">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead title="What it does" aside="All of it, today" />
          <Numbered items={DOES} />
        </div>
      </section>

      <section id="pairing" className="px-5 pt-16 md:px-8 md:pt-[72px]">
        <div className="mx-auto max-w-[1240px]">
          <SectionHead title="Setting it up" aside="Nothing to type" />
          <Numbered items={PAIRING} />

          <div className="notch mt-3.5 border border-border bg-surface-2 p-5">
            <span className="hud-label">{"// Worth knowing first"}</span>
            <ul className="mt-3 grid gap-2.5">
              {[
                "Windows will not draw anything over a game running in exclusive full screen, so League has to be in borderless for the overlay. The app says so rather than claiming a detection it cannot perform.",
                "Closing the window does not quit it — it keeps watching for a game from the tray. Launching on start-up is offered and ships switched off.",
                "Revoke a machine from your account settings and it is cut off mid-game, not at the next restart.",
              ].map((line) => (
                <li
                  key={line}
                  className="grid grid-cols-[14px_1fr] items-start gap-2.5 text-[13.5px] leading-relaxed text-text-body"
                >
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/settings/desktop"
              className="mt-5 inline-flex font-mono text-[11px] uppercase tracking-label text-accent"
            >
              Manage paired machines &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
