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

export const COMMAND_DEFINITIONS: SlashCommandDefinition[] = [
  {
    name: "lolai",
    description: "LoL AI Coach — help and account linking",
    options: [
      {
        type: CommandOptionType.Subcommand,
        name: "help",
        description: "What this bot can do",
      },
    ],
    ...ANYWHERE,
  },
];
