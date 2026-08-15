import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";

interface Props {
  riotId: string;
  region: string;
  /** Riot itself is throttling us — a different message, because retrying works. */
  rateLimited?: boolean;
}

/**
 * The dead end, made not-dead: a miss is nearly always a typo or the wrong platform, so the fix
 * is another search rather than a link back to the home page.
 */
export function ProfileNotFound({ riotId, region, rateLimited }: Props): React.ReactElement {
  return (
    <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
      <p className="hud-label">{rateLimited ? "// Riot api busy" : "// Not found"}</p>

      <h1 className="mt-3 font-display text-2xl font-extrabold uppercase text-text">
        {rateLimited ? "Riot is rate limiting us" : `${riotId} not found`}
      </h1>

      <p className="mx-auto mt-3 max-w-[420px] text-sm text-text-muted">
        {rateLimited
          ? "This one is on Riot's side, not yours. Give it a few seconds and try again."
          : `No such player on ${region.toUpperCase()}. Riot IDs are case-insensitive but the tag matters, and a name that exists on one platform will not exist on another.`}
      </p>

      <div className="mx-auto mt-7 max-w-[420px] text-left">
        <PlayerSearchBar size="lg" placeholder="Try another Riot ID" />
      </div>
    </div>
  );
}
