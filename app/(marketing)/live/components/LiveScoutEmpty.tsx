import Link from "next/link";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";

type Reason = "not-in-game" | "not-found" | "rate-limited" | "throttled";

interface Props {
  riotId: string;
  region: string;
  reason: Reason;
}

const COPY: Record<Reason, { label: string; title: string; body: string }> = {
  "not-in-game": {
    label: "// Not in a game",
    title: "Nobody is in a game here",
    body: "Riot only exposes a game once it has actually started — champion select is not visible to anyone outside the client. Try again a minute after the loading screen.",
  },
  "not-found": {
    label: "// Not found",
    title: "No such player",
    body: "Riot IDs are case-insensitive but the tag matters, and a name that exists on one platform will not exist on another.",
  },
  "rate-limited": {
    label: "// Riot api busy",
    title: "Riot is rate limiting us",
    body: "This one is on Riot's side, not yours. Give it a few seconds and try again.",
  },
  throttled: {
    label: "// Slow down",
    title: "Too many live lookups",
    body: "Scouting a game reads ten players from Riot at once, so this page is capped harder than the rest of the site. Wait a minute and try again.",
  },
};

/**
 * Every way this page can have nothing to show.
 *
 * "Not in a game" is the common one and is not an error — most visits to a live URL will land
 * here, because the reason somebody opens it is to find out. It keeps the profile link so the
 * visit is still worth something.
 */
export function LiveScoutEmpty({ riotId, region, reason }: Props): React.ReactElement {
  const copy = COPY[reason];
  const [gameName, tagLine] = riotId.split("#");

  return (
    <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
      <p className="hud-label">{copy.label}</p>

      <h1 className="mt-3 font-display text-2xl font-extrabold uppercase text-text">
        {copy.title}
      </h1>

      <p className="mx-auto mt-3 max-w-[440px] text-sm text-text-muted">{copy.body}</p>

      {reason !== "not-found" && gameName && tagLine && (
        <Link
          href={`/s/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`}
          className="mt-6 inline-block border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          See {riotId}&apos;s profile instead →
        </Link>
      )}

      <div className="mx-auto mt-7 max-w-[420px] text-left">
        <PlayerSearchBar size="lg" placeholder="Scout another Riot ID" />
      </div>
    </div>
  );
}
