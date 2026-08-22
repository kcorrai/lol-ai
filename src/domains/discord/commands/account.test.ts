import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/discord/linkService", () => ({
  getLinkedIdentity: vi.fn(),
  unlinkDiscordAccount: vi.fn(),
}));

import { linkCommand, statusCommand, unlinkCommand } from "@/domains/discord/commands/account";
import { getLinkedIdentity, unlinkDiscordAccount } from "@/domains/discord/linkService";
import { readLinkToken } from "@/domains/discord/linkToken";
import type { BotRequest } from "@/domains/discord/request";
import { ButtonStyle, type ContainerComponent } from "@/lib/discord/componentTypes";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { MessageFlags } from "@/lib/discord/interactionTypes";

const REQ: BotRequest = {
  command: "lolai",
  subcommand: "link",
  discordUserId: "123456789",
  discordUsername: "kaan",
};

function body(payload: DiscordMessagePayload): string {
  return JSON.stringify((payload.components[0] as ContainerComponent).components);
}

function linkUrl(payload: DiscordMessagePayload): string {
  const root = payload.components[0] as ContainerComponent;
  for (const child of root.components) {
    if (child.type !== 1) continue;
    const button = child.components.find((b) => b.style === ButtonStyle.Link);
    if (button?.url) return button.url;
  }
  throw new Error("no link button on the card");
}

describe("account commands", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AUTH_ENCRYPTION_KEY = "b".repeat(64);
  });

  it("hands out a token that decodes back to the caller", async () => {
    vi.mocked(getLinkedIdentity).mockResolvedValue(null);

    const payload = await linkCommand(REQ);
    const token = new URL(linkUrl(payload)).searchParams.get("token");

    expect(readLinkToken(token ?? "")).toEqual({
      discordUserId: "123456789",
      discordUsername: "kaan",
    });
  });

  // The token is a bearer credential for this Discord account. Posting it into
  // a channel would hand it to everyone who can read the channel.
  it("never posts the link publicly", async () => {
    vi.mocked(getLinkedIdentity).mockResolvedValue(null);

    const payload = await linkCommand(REQ);

    expect(payload.flags & MessageFlags.Ephemeral).toBe(MessageFlags.Ephemeral);
  });

  it("shows status instead of a second token when already linked", async () => {
    vi.mocked(getLinkedIdentity).mockResolvedValue({
      userId: "user-1",
      discordUsername: "kaan",
      riotAccount: { gameName: "Faker", tagLine: "KR1", region: "kr" },
    });

    const payload = await linkCommand(REQ);

    expect(body(payload)).toContain("Faker#KR1");
    expect(body(payload)).not.toContain("/settings/discord/link?token=");
  });

  it("says so when the linked profile has no Riot account yet", async () => {
    vi.mocked(getLinkedIdentity).mockResolvedValue({
      userId: "user-1",
      discordUsername: "kaan",
      riotAccount: null,
    });

    expect(body(await statusCommand(REQ))).toContain("No Riot account connected");
  });

  it("reports an unlink, and reports having nothing to unlink", async () => {
    vi.mocked(unlinkDiscordAccount).mockResolvedValue(true);
    expect(body(await unlinkCommand(REQ))).toContain("Unlinked");

    vi.mocked(unlinkDiscordAccount).mockResolvedValue(false);
    expect(body(await unlinkCommand(REQ))).toContain("not linked to anything");
  });
});
