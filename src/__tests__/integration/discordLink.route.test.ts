import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/domains/discord/linkService", () => ({ linkDiscordAccount: vi.fn() }));

import { POST } from "../../../app/api/discord/link/route";
import { linkDiscordAccount } from "@/domains/discord/linkService";
import { createLinkToken } from "@/domains/discord/linkToken";
import {
  authenticateAs,
  authenticateAsNobody,
  readApiResponse,
  routeRequest,
} from "@/test/apiRoute";

const CLAIMS = { discordUserId: "123456789", discordUsername: "kaan" };

function request(body: unknown) {
  return routeRequest("/api/discord/link", { body });
}

describe("POST /api/discord/link", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AUTH_ENCRYPTION_KEY = "c".repeat(64);
    authenticateAs({ id: "user-1" });
    vi.mocked(linkDiscordAccount).mockResolvedValue("linked");
  });

  it("links the Discord account the token names to the signed-in user", async () => {
    const res = await POST(request({ token: createLinkToken(CLAIMS) }));
    const { status, data } = await readApiResponse<{ discordUsername: string }>(res);

    expect(status).toBe(200);
    expect(data?.discordUsername).toBe("kaan");
    expect(linkDiscordAccount).toHaveBeenCalledWith("user-1", "123456789", "kaan");
  });

  // Both halves are required: the token proves the Discord side, the session
  // proves the website side. Neither alone may create a link.
  it("refuses a valid token with no session", async () => {
    authenticateAsNobody();

    const { status } = await readApiResponse(
      await POST(request({ token: createLinkToken(CLAIMS) }))
    );

    expect(status).toBe(401);
    expect(linkDiscordAccount).not.toHaveBeenCalled();
  });

  it("refuses an expired token", async () => {
    const expired = createLinkToken(CLAIMS, Date.now() - 60 * 60 * 1000);

    const { status, error } = await readApiResponse(await POST(request({ token: expired })));

    expect(status).toBe(422);
    expect(error?.message).toContain("expired");
    expect(linkDiscordAccount).not.toHaveBeenCalled();
  });

  it("refuses a token that was tampered with", async () => {
    const token = createLinkToken(CLAIMS);
    const flipped = token.slice(0, -2) + (token.endsWith("A") ? "B" : "A");

    expect((await readApiResponse(await POST(request({ token: flipped })))).status).toBe(422);
    expect(linkDiscordAccount).not.toHaveBeenCalled();
  });

  it("rejects a missing token and a malformed body", async () => {
    expect((await readApiResponse(await POST(request({})))).status).toBe(422);
    expect(
      (await readApiResponse(await POST(routeRequest("/api/discord/link", { body: "{" })))).status
    ).toBe(422);
  });

  // Otherwise whoever ran the slash command last would take the Discord account
  // off whoever linked it first.
  it("does not move a Discord account already claimed by another profile", async () => {
    vi.mocked(linkDiscordAccount).mockResolvedValue("taken");

    const { status, error } = await readApiResponse(
      await POST(request({ token: createLinkToken(CLAIMS) }))
    );

    expect(status).toBe(409);
    expect(error?.message).toContain("already linked");
  });
});
