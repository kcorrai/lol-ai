// Wire types for Discord's Components V2 message layout system.
//
// A message sent with the IS_COMPONENTS_V2 flag drops `content` and `embeds`
// entirely: everything is components. That buys real layout control — an
// accent-coloured container, sections with their own thumbnail, separators —
// which is why the bot uses it instead of classic embeds.

export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  Separator: 14,
  Container: 17,
} as const;

export const ButtonStyle = {
  Primary: 1,
  Secondary: 2,
  Success: 3,
  Danger: 4,
  Link: 5,
} as const;

export type ButtonStyleValue = (typeof ButtonStyle)[keyof typeof ButtonStyle];

export interface UnfurledMedia {
  url: string;
}

export interface TextDisplayComponent {
  type: typeof ComponentType.TextDisplay;
  content: string;
}

export interface ThumbnailComponent {
  type: typeof ComponentType.Thumbnail;
  media: UnfurledMedia;
  description?: string;
}

export interface ButtonComponent {
  type: typeof ComponentType.Button;
  style: ButtonStyleValue;
  label?: string;
  emoji?: { name: string };
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface SectionComponent {
  type: typeof ComponentType.Section;
  components: TextDisplayComponent[];
  // A section must carry exactly one accessory — Discord rejects it otherwise.
  accessory: ThumbnailComponent | ButtonComponent;
}

export interface SeparatorComponent {
  type: typeof ComponentType.Separator;
  divider?: boolean;
  spacing?: 1 | 2;
}

export interface MediaGalleryComponent {
  type: typeof ComponentType.MediaGallery;
  items: { media: UnfurledMedia; description?: string }[];
}

export interface ActionRowComponent {
  type: typeof ComponentType.ActionRow;
  components: ButtonComponent[];
}

export type ContainerChild =
  | TextDisplayComponent
  | SectionComponent
  | SeparatorComponent
  | MediaGalleryComponent
  | ActionRowComponent;

export interface ContainerComponent {
  type: typeof ComponentType.Container;
  accent_color?: number;
  components: ContainerChild[];
}

export type TopLevelComponent = ContainerChild | ContainerComponent;

export interface DiscordMessagePayload {
  flags: number;
  components: TopLevelComponent[];
  // The bot renders player names it did not author. Without this, a Riot ID
  // containing something that looks like a mention would ping a real role.
  allowed_mentions: { parse: [] };
}
