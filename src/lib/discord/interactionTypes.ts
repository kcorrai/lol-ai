// Wire types for the Discord Interactions API (v10). Only the fields this app
// reads are modelled — Discord sends a great deal more, and typing all of it
// would be a maintenance burden with no payoff.

export const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
  MessageComponent: 3,
  Autocomplete: 4,
  ModalSubmit: 5,
} as const;

export const InteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4,
  DeferredChannelMessageWithSource: 5,
  DeferredUpdateMessage: 6,
  UpdateMessage: 7,
  AutocompleteResult: 8,
  Modal: 9,
} as const;

export const MessageFlags = {
  Ephemeral: 1 << 6, // 64
  IsComponentsV2: 1 << 15, // 32768
} as const;

export const CommandOptionType = {
  Subcommand: 1,
  SubcommandGroup: 2,
  String: 3,
  Integer: 4,
  Boolean: 5,
} as const;

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

export interface DiscordGuildMember {
  user?: DiscordUser;
}

export interface StringCommandOption {
  type: typeof CommandOptionType.String;
  name: string;
  value: string;
  focused?: boolean;
}

export interface IntegerCommandOption {
  type: typeof CommandOptionType.Integer;
  name: string;
  value: number;
  focused?: boolean;
}

export interface BooleanCommandOption {
  type: typeof CommandOptionType.Boolean;
  name: string;
  value: boolean;
  focused?: boolean;
}

export interface SubcommandOption {
  type: typeof CommandOptionType.Subcommand | typeof CommandOptionType.SubcommandGroup;
  name: string;
  options?: CommandOption[];
}

export type CommandOption =
  | StringCommandOption
  | IntegerCommandOption
  | BooleanCommandOption
  | SubcommandOption;

export interface ApplicationCommandData {
  id: string;
  name: string;
  options?: CommandOption[];
}

export interface MessageComponentData {
  custom_id: string;
  component_type: number;
  values?: string[];
}

interface InteractionBase {
  id: string;
  application_id: string;
  token: string;
  // Present in a guild; absent in a DM, where `user` is set instead.
  member?: DiscordGuildMember;
  user?: DiscordUser;
  guild_id?: string;
  channel_id?: string;
  locale?: string;
}

export interface PingInteraction extends InteractionBase {
  type: typeof InteractionType.Ping;
}

export interface CommandInteraction extends InteractionBase {
  type: typeof InteractionType.ApplicationCommand;
  data: ApplicationCommandData;
}

export interface ComponentInteraction extends InteractionBase {
  type: typeof InteractionType.MessageComponent;
  data: MessageComponentData;
}

export interface AutocompleteInteraction extends InteractionBase {
  type: typeof InteractionType.Autocomplete;
  data: ApplicationCommandData;
}

export interface ModalSubmitInteraction extends InteractionBase {
  type: typeof InteractionType.ModalSubmit;
  data: { custom_id: string };
}

export type DiscordInteraction =
  | PingInteraction
  | CommandInteraction
  | ComponentInteraction
  | AutocompleteInteraction
  | ModalSubmitInteraction;

export interface AutocompleteChoice {
  name: string;
  value: string;
}
