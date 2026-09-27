import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";

interface Props {
  riotId: string;
  region: string;
  /**
   * `rate-limited`: Riot is throttling us. `throttled`: this visitor has looked up many fresh
   * profiles in a short time. Both are worth retrying, so neither may read as "no such player".
   */
  reason: "not-found" | "rate-limited" | "throttled";
}

const COPY = {
  "rate-limited": {
    label: "// Riot api busy",
    title: () => "Riot is rate limiting us",
    body: () => "This one is on Riot's side, not yours. Give it a few seconds and try again.",
  },
  throttled: {
    label: "// Slow down",
    title: () => "Too many lookups",
    body: () =>
      "You have looked up a lot of new players in the last few minutes. Profiles you have already opened still load; new ones will again shortly.",
  },
  "not-found": {
    label: "// Not found",
    title: (riotId: string) => `${riotId} not found`,
    body: (region: string) =>
      `No such player on ${region.toUpperCase()}. Riot IDs are case-insensitive but the tag matters, and a name that exists on one platform will not exist on another.`,
  },
} as const;

/**
 * The dead end, made not-dead: a miss is nearly always a typo or the wrong platform, so the fix
 * is another search rather than a link back to the home page.
 */
export function ProfileNotFound({ riotId, region, reason }: Props): React.ReactElement {
  const copy = COPY[reason];
  return (
    <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
      <p className="hud-label">{copy.label}</p>

      <h1 className="mt-3 font-display text-2xl font-extrabold uppercase text-text">
        {copy.title(riotId)}
      </h1>

      <p className="mx-auto mt-3 max-w-[420px] text-sm text-text-muted">{copy.body(region)}</p>

      <div className="mx-auto mt-7 max-w-[420px] text-left">
        <PlayerSearchBar size="lg" placeholder="Try another Riot ID" />
      </div>
    </div>
  );
}
