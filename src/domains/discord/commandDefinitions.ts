import { RIOT_REGION_CONFIG } from "@/domains/riot/config/regions";
import { CommandOptionType } from "@/lib/discord/interactionTypes";

export interface SlashCommandOption {
  type: number;
  name: string;
  description: string;
  required?: boolean;
  autocomplete?: boolean;
  choices?: { name: string; value: string }[];
  options?: SlashCommandOption[];
}

export interface SlashCommandDefinition {
  name: string;
  description: string;
  options?: SlashCommandOption[];
  // 0 = installed to a guild, 1 = installed to a user account. Offering both
  // means someone can carry the bot into servers that have not added it.
  integration_types: number[];
  // 0 = guild, 1 = bot DM, 2 = private channel.
  contexts: number[];
}

const ANYWHERE = { integration_types: [0, 1], contexts: [0, 1, 2] };

// Eleven shards fits comfortably inside Discord's 25-choice cap, so this is a
// fixed list rather than an autocomplete — one fewer round trip while typing.
const REGION_OPTION: SlashCommandOption = {
  type: CommandOptionType.String,
  name: "region",
  description: "Which shard they play on. Guessed from past games when left out.",
  choices: Object.entries(RIOT_REGION_CONFIG).map(([value, { label, flag }]) => ({
    name: `${flag} ${label}`,
    value,
  })),
};

const RIOT_ID_OPTION: SlashCommandOption = {
  type: CommandOptionType.String,
  name: "riot-id",
  description: "Riot ID, e.g. Faker#KR1. Optional once you have run /lolai link.",
  autocomplete: true,
};

function lookup(name: string, description: string): SlashCommandDefinition {
  return {
    name,
    description,
    options: [RIOT_ID_OPTION, REGION_OPTION],
    ...ANYWHERE,
  };
}

export const COMMAND_DEFINITIONS: SlashCommandDefinition[] = [
  lookup("rank", "Current rank, LP and recent form"),
  lookup("profile", "Rank, best champions and a coaching read in one card"),
  lookup("champions", "Most-played champions with win rates"),
  lookup("match", "A breakdown of the last game played"),
  lookup("live", "Who is in the game right now, lane by lane"),
  {
    name: "coach",
    description: "Your recurring habits and what to work on next (Pro, linked accounts)",
    ...ANYWHERE,
  },
  {
    name: "lolai",
    description: "LoL AI Coach — help and account linking",
    options: [
      {
        type: CommandOptionType.Subcommand,
        name: "help",
        description: "What this bot can do",
      },
      {
        type: CommandOptionType.Subcommand,
        name: "link",
        description: "Connect your Discord to your LoL AI Coach account",
      },
      {
        type: CommandOptionType.Subcommand,
        name: "status",
        description: "Show which account this Discord is linked to",
      },
      {
        type: CommandOptionType.Subcommand,
        name: "unlink",
        description: "Disconnect your Discord from your LoL AI Coach account",
      },
    ],
    ...ANYWHERE,
  },
];
