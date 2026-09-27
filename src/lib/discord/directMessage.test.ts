import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { sendDirectMessage } from "@/lib/discord/directMessage";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function reply(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => fetchMock.mockReset());

describe("sendDirectMessage", () => {
  it("opens the DM channel, then posts into it with the bot token", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { id: "chan-1" })).mockResolvedValueOnce(reply(200));

    expect(await sendDirectMessage("user-9", "hello", "tok")).toBe(true);

    const [openUrl, openInit] = fetchMock.mock.calls[0];
    expect(openUrl).toBe("https://discord.com/api/v10/users/@me/channels");
    expect(openInit.headers.Authorization).toBe("Bot tok");
    expect(JSON.parse(openInit.body)).toEqual({ recipient_id: "user-9" });

    const [sendUrl, sendInit] = fetchMock.mock.calls[1];
    expect(sendUrl).toBe("https://discord.com/api/v10/channels/chan-1/messages");
    expect(JSON.parse(sendInit.body)).toEqual({
      content: "hello",
      allowed_mentions: { parse: [] },
    });
  });

  it("gives up quietly when the channel cannot be opened", async () => {
    fetchMock.mockResolvedValueOnce(reply(403));

    expect(await sendDirectMessage("user-9", "hello", "tok")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a refused message as not sent", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { id: "chan-1" })).mockResolvedValueOnce(reply(403));

    expect(await sendDirectMessage("user-9", "hello", "tok")).toBe(false);
  });

  it("never throws, even when the network does", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    expect(await sendDirectMessage("user-9", "hello", "tok")).toBe(false);
  });
});
