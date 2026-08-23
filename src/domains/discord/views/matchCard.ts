import { BRAND_COLOR, LOSS_COLOR, WIN_COLOR } from "@/domains/discord/brand";
import type { BotRequest } from "@/domains/discord/request";
import { compact, duration, positionLabel } from "@/domains/discord/views/format";
import { card, cardActions, cardFooter } from "@/domains/discord/views/shell";
import { queueLabel } from "@/domains/match";
import type { LastMatchSummary } from "@/domains/riot";
import { mediaGallery, section, separator, textDisplay, thumbnail } from "@/lib/discord/components";
import type { ContainerChild, DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { championIconUrl, itemIconUrl } from "@/lib/ddragon";

function outcome(match: LastMatchSummary): string {
  if (match.remake) return "🔄 Remake";
  return match.win ? "🟢 Victory" : "🔴 Defeat";
}

function statLine(match: LastMatchSummary): string {
  return [
    `**CS** ${match.cs} (${match.csPerMinute}/min)`,
    `**Damage** ${compact(match.damageToChampions)} (${Math.round(match.damageShare * 100)}%)`,
    `**Gold** ${compact(match.goldEarned)}`,
    `**Vision** ${match.visionScore}`,
  ].join("  ·  ");
}

export function matchCard(
  match: LastMatchSummary,
  req: BotRequest,
  profilePath: string
): DiscordMessagePayload {
  const role = match.player.position ? ` · ${positionLabel(match.player.position)}` : "";

  const body: ContainerChild[] = [
    section(
      [
        `### ${outcome(match)} · ${queueLabel(match.queue)}`,
        `**${match.player.championName}**${role} · ${match.kills}/${match.deaths}/${match.assists} (${match.kda} KDA)`,
        `${duration(match.durationSeconds)} · ${match.player.riotId}`,
      ],
      thumbnail(championIconUrl(match.player.championName), match.player.championName)
    ),
    separator(),
  ];

  // A remake's numbers describe four minutes of standing still, so the card
  // stops at the result rather than pretending they mean something.
  if (!match.remake) {
    body.push(textDisplay(statLine(match)));
    if (match.opponent) {
      body.push(textDisplay(`**Lane opponent** \`${match.opponent.championName}\``));
    }
    if (match.items.length > 0) {
      body.push(
        mediaGallery(match.items.map((id) => ({ url: itemIconUrl(id), description: `Item ${id}` })))
      );
    }
  }

  return card([...body, ...cardFooter(), cardActions(req, profilePath)], {
    // A remake was neither won nor lost, so it gets the neutral brand colour
    // rather than the green a 4-minute surrender would otherwise inherit.
    accentColor: match.remake ? BRAND_COLOR : match.win ? WIN_COLOR : LOSS_COLOR,
  });
}
