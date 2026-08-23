import {
  CommandOptionType,
  type CommandInteraction,
  type CommandOption,
  type ComponentInteraction,
  type DiscordUser,
} from "@/lib/discord/interactionTypes";

/** A command invocation, normalised so a slash command and a button look alike. */
export interface BotRequest {
  command: string;
  subcommand?: string;
  riotId?: string;
  region?: string;
  discordUserId: string;
  discordUsername: string;
}

// Bumped if the encoding ever changes, so buttons on messages posted by an older
// deploy fail closed instead of being misread.
const CUSTOM_ID_VERSION = "d1";
const CUSTOM_ID_MAX = 100;

/** In a guild the caller is under `member`; in a DM it is under `user`. */
function actingUser(interaction: {
  member?: { user?: DiscordUser };
  user?: DiscordUser;
}): DiscordUser | null {
  return interaction.member?.user ?? interaction.user ?? null;
}

function findOption(options: CommandOption[] | undefined, name: string): CommandOption | undefined {
  return options?.find((o) => o.name === name);
}

function stringOption(options: CommandOption[] | undefined, name: string): string | undefined {
  const opt = findOption(options, name);
  if (!opt || opt.type !== CommandOptionType.String) return undefined;
  const value = opt.value.trim();
  return value.length > 0 ? value : undefined;
}

export function parseCommandInteraction(interaction: CommandInteraction): BotRequest | null {
  const user = actingUser(interaction);
  if (!user) return null;

  const top = interaction.data.options;
  const sub = top?.find(
    (o) => o.type === CommandOptionType.Subcommand || o.type === CommandOptionType.SubcommandGroup
  );
  const options = sub && "options" in sub ? sub.options : top;

  return {
    command: interaction.data.name,
    subcommand: sub?.name,
    riotId: stringOption(options, "riot-id"),
    region: stringOption(options, "region"),
    discordUserId: user.id,
    discordUsername: user.global_name ?? user.username,
  };
}

export function parseComponentInteraction(interaction: ComponentInteraction): BotRequest | null {
  const user = actingUser(interaction);
  if (!user) return null;

  const decoded = decodeCustomId(interaction.data.custom_id);
  if (!decoded) return null;

  return {
    ...decoded,
    discordUserId: user.id,
    discordUsername: user.global_name ?? user.username,
  };
}

/**
 * Encodes what a Refresh button needs to re-run a command. Returns null when it
 * would exceed Discord's 100-character custom_id limit, so the caller drops the
 * button rather than shipping one Discord will reject.
 *
 * Nothing privileged travels in here — it is a public lookup, and anything
 * user-scoped is resolved from the interaction's own Discord user id instead.
 */
export function encodeCustomId(parts: {
  command: string;
  subcommand?: string;
  region?: string;
  riotId?: string;
}): string | null {
  const id = [
    CUSTOM_ID_VERSION,
    parts.command,
    parts.subcommand ?? "",
    parts.region ?? "",
    parts.riotId ?? "",
  ].join(":");
  return id.length <= CUSTOM_ID_MAX ? id : null;
}

export function decodeCustomId(
  customId: string
): Pick<BotRequest, "command" | "subcommand" | "region" | "riotId"> | null {
  const parts = customId.split(":");
  if (parts.length < 5 || parts[0] !== CUSTOM_ID_VERSION || !parts[1]) return null;

  return {
    command: parts[1],
    subcommand: parts[2] || undefined,
    region: parts[3] || undefined,
    // A Riot ID cannot contain a colon, but rejoining rather than indexing means
    // a malformed id degrades into a failed lookup instead of a silent truncation.
    riotId: parts.slice(4).join(":") || undefined,
  };
}
