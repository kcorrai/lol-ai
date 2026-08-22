import { generateKeyPairSync, sign as cryptoSign, type KeyObject } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("@/inngest/client", () => ({ inngest: { send: (...args: unknown[]) => send(...args) } }));

import { POST } from "../../../app/api/discord/interactions/route";
import { InteractionResponseType } from "@/lib/discord/interactionTypes";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const der = publicKey.export({ format: "der", type: "spki" }) as Buffer;
const PUBLIC_KEY_HEX = der.subarray(der.length - 32).toString("hex");

function signedRequest(body: unknown, opts: { key?: KeyObject; timestamp?: string } = {}) {
  const raw = JSON.stringify(body);
  const timestamp = opts.timestamp ?? "1750000000";
  const signature = cryptoSign(
    null,
    Buffer.from(timestamp + raw, "utf8"),
    opts.key ?? privateKey
  ).toString("hex");

  return new NextRequest("https://lolaicoach.gg/api/discord/interactions", {
    method: "POST",
    body: raw,
    headers: {
      "content-type": "application/json",
      "x-signature-ed25519": signature,
      "x-signature-timestamp": timestamp,
    },
  });
}

const HELP_COMMAND = {
  id: "1",
  application_id: "app-1",
  token: "interaction-token",
  type: 2,
  member: { user: { id: "discord-user-1", username: "kaan" } },
  data: { id: "cmd-1", name: "lolai", options: [{ type: 1, name: "help" }] },
};

describe("POST /api/discord/interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DISCORD_PUBLIC_KEY = PUBLIC_KEY_HEX;
  });

  it("rejects an unsigned request with 401", async () => {
    const res = await POST(
      new NextRequest("https://lolaicoach.gg/api/discord/interactions", {
        method: "POST",
        body: JSON.stringify({ type: 1 }),
      })
    );

    expect(res.status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  // Discord probes a new endpoint URL with a deliberately invalid signature and
  // will not save it unless that probe is refused.
  it("rejects a signature made with a different key", async () => {
    const other = generateKeyPairSync("ed25519");
    const res = await POST(signedRequest({ type: 1 }, { key: other.privateKey }));

    expect(res.status).toBe(401);
  });

  it("answers a PING with a PONG", async () => {
    const res = await POST(signedRequest({ type: 1 }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ type: InteractionResponseType.Pong });
    expect(send).not.toHaveBeenCalled();
  });

  it("defers a slash command and hands it to Inngest exactly once", async () => {
    const res = await POST(signedRequest(HELP_COMMAND));

    await expect(res.json()).resolves.toEqual({
      type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({
      name: "discord/interaction.received",
      data: {
        request: {
          command: "lolai",
          subcommand: "help",
          riotId: undefined,
          region: undefined,
          discordUserId: "discord-user-1",
          discordUsername: "kaan",
        },
        applicationId: "app-1",
        token: "interaction-token",
      },
    });
  });

  it("defers a button press as an in-place update", async () => {
    const res = await POST(
      signedRequest({
        id: "2",
        application_id: "app-1",
        token: "t",
        type: 3,
        member: { user: { id: "discord-user-1", username: "kaan" } },
        data: { custom_id: "d1:rank::euw1:Faker#KR1", component_type: 2 },
      })
    );

    await expect(res.json()).resolves.toEqual({
      type: InteractionResponseType.DeferredUpdateMessage,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("acknowledges a button whose custom_id predates the current encoding", async () => {
    const res = await POST(
      signedRequest({
        id: "3",
        application_id: "app-1",
        token: "t",
        type: 3,
        member: { user: { id: "u", username: "k" } },
        data: { custom_id: "legacy-button", component_type: 2 },
      })
    );

    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  // A deferred ACK that is never followed up leaves Discord showing "thinking…"
  // for fifteen minutes. Saying so immediately is the lesser failure.
  it("answers immediately when the job queue cannot be reached", async () => {
    send.mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await POST(signedRequest(HELP_COMMAND));
    const json = (await res.json()) as { type: number; data?: { flags: number } };

    expect(res.status).toBe(200);
    expect(json.type).toBe(InteractionResponseType.ChannelMessageWithSource);
    expect(json.data?.flags).toBeDefined();
  });

  it("returns an empty autocomplete list when no command supplies choices", async () => {
    const res = await POST(
      signedRequest({
        id: "4",
        application_id: "app-1",
        token: "t",
        type: 4,
        member: { user: { id: "u", username: "k" } },
        data: { id: "c", name: "rank", options: [] },
      })
    );

    await expect(res.json()).resolves.toEqual({
      type: InteractionResponseType.AutocompleteResult,
      data: { choices: [] },
    });
  });
});
