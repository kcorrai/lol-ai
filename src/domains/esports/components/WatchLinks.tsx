import { WatchEmbed } from "@/domains/esports/components/WatchEmbed";
import type { PrimaryEmbed } from "@/domains/esports/watchEmbed";
import type { WatchLink } from "@/domains/esports/watch";

const PROVIDER_LABEL: Record<WatchLink["provider"], string> = {
  twitch: "Twitch",
  youtube: "YouTube",
};

/**
 * Where to watch: a player for the primary broadcast, and one chip per
 * broadcast for the rest.
 *
 * The player is click-to-load — nothing from Twitch or YouTube is requested
 * until the reader asks for it (`WatchEmbed`). The chips stay regardless: they
 * are how a reader reaches the other eight languages, and how anyone reaches a
 * broadcast we can build no embed for. Every chip is `rel="noopener"` because
 * they all leave the site.
 *
 * Renders nothing when there is nothing to watch — an empty "watch" heading is
 * worse than no heading, and most older matches have no VOD published.
 */
export function WatchLinks({
  links,
  label,
  embed,
}: {
  links: WatchLink[];
  label: string;
  /** Built on the server by `primaryVodEmbed`/`primaryStreamEmbed`. */
  embed?: PrimaryEmbed | null;
}): React.ReactElement | null {
  if (links.length === 0) return null;

  return (
    <div className="grid gap-2.5">
      {embed && (
        <WatchEmbed
          src={embed.src}
          label={label.replace(/^Watch /i, "")}
          title={`${label} — ${PROVIDER_LABEL[embed.link.provider]}, ${embed.link.language}`}
        />
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="hud-label mr-1">{label}</span>
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tag-cut bg-surface-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-label text-text-body transition-colors hover:bg-surface hover:text-text"
          >
            {PROVIDER_LABEL[link.provider]}
            <span className="ml-1.5 text-text-faint">{link.language}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
