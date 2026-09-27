import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { discordIntegration: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/discord/directMessage", () => ({ sendDirectMessage: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { sendDirectMessage } from "@/lib/discord/directMessage";
import { messageLinkedUser } from "@/domains/discord/directMessageService";

const db = vi.mocked(prisma, true);
const send = vi.mocked(sendDirectMessage);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DISCORD_BOT_TOKEN", "tok");
  send.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

describe("messageLinkedUser", () => {
  it("DMs a user who linked Discord through the bot", async () => {
    db.discordIntegration.findUnique.mockResolvedValue({ discordUserId: "d-1" } as never);

    expect(await messageLinkedUser("u-1", "hi")).toBe(true);
    expect(send).toHaveBeenCalledWith("d-1", "hi", "tok");
  });

  it("skips a user with no bot link", async () => {
    db.discordIntegration.findUnique.mockResolvedValue({ discordUserId: null } as never);

    expect(await messageLinkedUser("u-1", "hi")).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("does nothing at all without a bot token", async () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", "");

    expect(await messageLinkedUser("u-1", "hi")).toBe(false);
    expect(db.discordIntegration.findUnique).not.toHaveBeenCalled();
  });
});
