import { describe, expect, it } from "vitest";
import {
  actionRow,
  button,
  componentsV2Message,
  container,
  linkButton,
  mediaGallery,
  section,
  separator,
  textDisplay,
  thumbnail,
} from "@/lib/discord/components";
import { ButtonStyle, ComponentType } from "@/lib/discord/componentTypes";
import { MessageFlags } from "@/lib/discord/interactionTypes";

describe("components", () => {
  it("sets the Components V2 flag and suppresses mentions", () => {
    const msg = componentsV2Message([textDisplay("hi")]);

    expect(msg.flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);
    expect(msg.flags & MessageFlags.Ephemeral).toBe(0);
    expect(msg.allowed_mentions).toEqual({ parse: [] });
  });

  it("adds the ephemeral flag without dropping the V2 flag", () => {
    const msg = componentsV2Message([textDisplay("hi")], { ephemeral: true });

    expect(msg.flags).toBe(MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral);
  });

  it("joins section lines into a single text display so the card stays tight", () => {
    const s = section(["**Faker#KR1**", "Challenger · 1204 LP"], thumbnail("https://x/y.png"));

    expect(s.components).toHaveLength(1);
    expect(s.components[0].content).toBe("**Faker#KR1**\nChallenger · 1204 LP");
    expect(s.accessory.type).toBe(ComponentType.Thumbnail);
  });

  it("omits accent_color when no tier colour is known", () => {
    expect(container([textDisplay("x")])).not.toHaveProperty("accent_color");
    expect(container([textDisplay("x")], 0xc89b3c).accent_color).toBe(0xc89b3c);
  });

  it("builds link and custom-id buttons with the right styles", () => {
    const link = linkButton("Open ↗", "https://lolaicoach.com", "🔗");
    expect(link.style).toBe(ButtonStyle.Link);
    expect(link.url).toBe("https://lolaicoach.com");
    expect(link.custom_id).toBeUndefined();
    expect(link.emoji).toEqual({ name: "🔗" });

    const refresh = button({ label: "Refresh", customId: "d1:rank:euw1:a#b" });
    expect(refresh.style).toBe(ButtonStyle.Secondary);
    expect(refresh.custom_id).toBe("d1:rank:euw1:a#b");
    expect(refresh.url).toBeUndefined();
  });

  it("builds rows, separators and galleries with the documented type ids", () => {
    expect(actionRow(linkButton("a", "https://x")).type).toBe(ComponentType.ActionRow);
    expect(separator().type).toBe(ComponentType.Separator);
    expect(separator(false, 2)).toEqual({
      type: ComponentType.Separator,
      divider: false,
      spacing: 2,
    });
    expect(mediaGallery([{ url: "https://x/1.png", description: "item" }])).toEqual({
      type: ComponentType.MediaGallery,
      items: [{ media: { url: "https://x/1.png" }, description: "item" }],
    });
  });
});
