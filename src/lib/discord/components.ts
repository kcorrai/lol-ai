import { MessageFlags } from "@/lib/discord/interactionTypes";
import {
  ButtonStyle,
  ComponentType,
  type ActionRowComponent,
  type ButtonComponent,
  type ButtonStyleValue,
  type ContainerChild,
  type ContainerComponent,
  type DiscordMessagePayload,
  type MediaGalleryComponent,
  type SectionComponent,
  type SeparatorComponent,
  type TextDisplayComponent,
  type ThumbnailComponent,
  type TopLevelComponent,
} from "@/lib/discord/componentTypes";

export function textDisplay(content: string): TextDisplayComponent {
  return { type: ComponentType.TextDisplay, content };
}

export function thumbnail(url: string, description?: string): ThumbnailComponent {
  return { type: ComponentType.Thumbnail, media: { url }, description };
}

export function section(
  lines: string[],
  accessory: ThumbnailComponent | ButtonComponent
): SectionComponent {
  return {
    type: ComponentType.Section,
    // Discord allows up to three text displays in a section; joining into one
    // keeps the line spacing tight, which is what makes these read as a card
    // rather than as three stacked paragraphs.
    components: [textDisplay(lines.join("\n"))],
    accessory,
  };
}

export function separator(divider = true, spacing: 1 | 2 = 1): SeparatorComponent {
  return { type: ComponentType.Separator, divider, spacing };
}

export function mediaGallery(
  items: { url: string; description?: string }[]
): MediaGalleryComponent {
  return {
    type: ComponentType.MediaGallery,
    items: items.map((i) => ({ media: { url: i.url }, description: i.description })),
  };
}

export function linkButton(label: string, url: string, emoji?: string): ButtonComponent {
  return {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    label,
    url,
    ...(emoji ? { emoji: { name: emoji } } : {}),
  };
}

export function button(params: {
  label: string;
  customId: string;
  style?: ButtonStyleValue;
  emoji?: string;
  disabled?: boolean;
}): ButtonComponent {
  return {
    type: ComponentType.Button,
    style: params.style ?? ButtonStyle.Secondary,
    label: params.label,
    custom_id: params.customId,
    ...(params.emoji ? { emoji: { name: params.emoji } } : {}),
    ...(params.disabled ? { disabled: true } : {}),
  };
}

export function actionRow(...buttons: ButtonComponent[]): ActionRowComponent {
  return { type: ComponentType.ActionRow, components: buttons };
}

export function container(
  children: ContainerChild[],
  accentColor?: number
): ContainerComponent {
  return {
    type: ComponentType.Container,
    ...(accentColor === undefined ? {} : { accent_color: accentColor }),
    components: children,
  };
}

/** Wraps top-level components into a message body Discord will accept. */
export function componentsV2Message(
  components: TopLevelComponent[],
  opts: { ephemeral?: boolean } = {}
): DiscordMessagePayload {
  return {
    flags: MessageFlags.IsComponentsV2 | (opts.ephemeral ? MessageFlags.Ephemeral : 0),
    components,
    allowed_mentions: { parse: [] },
  };
}
