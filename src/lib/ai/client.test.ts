import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AiProvider } from "@/lib/ai/types";

const fakeProvider: AiProvider = {
  async complete() {
    return {
      content: '{"ok":true}',
      model: "fake-model-1",
      promptTokens: 700,
      completionTokens: 120,
      totalTokens: 820,
      latencyMs: 5,
    };
  },
  async *streamChat() {
    yield "he";
    yield "llo";
    return { model: "fake-model-1", promptTokens: 300, completionTokens: 40 };
  },
};

vi.mock("@/lib/ai/providers/openai", () => ({ createOpenAiProvider: () => fakeProvider }));
vi.mock("@/lib/ai/usage", () => ({ recordAiUsage: vi.fn() }));

import { getAiClient, __resetAiClients } from "./client";
import { recordAiUsage } from "@/lib/ai/usage";

const record = vi.mocked(recordAiUsage);
const ORIGINAL = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  __resetAiClients();
  process.env.AI_PROVIDER = "openai";
  record.mockResolvedValue(undefined);
});
afterEach(() => {
  process.env = { ...ORIGINAL };
  __resetAiClients();
});

describe("getAiClient", () => {
  /**
   * Recording lives in this wrapper rather than at the call sites because a call site can forget,
   * and ten of the eleven already had. There is no path to a model that skips it.
   */
  it("counts a completion against the task that made it", async () => {
    await getAiClient("coaching-report").complete("sys", "user");

    expect(record).toHaveBeenCalledWith({
      task: "coaching-report",
      model: "fake-model-1",
      promptTokens: 700,
      completionTokens: 120,
    });
  });

  it("returns the provider's result unchanged", async () => {
    const result = await getAiClient("coaching-report").complete("sys", "user");

    expect(result.content).toBe('{"ok":true}');
    expect(result.totalTokens).toBe(820);
  });

  /**
   * Chat is the highest-volume surface and runs on the expensive tier. Its tokens only arrive at
   * the end of the stream, so a ledger that could not read a generator's return value would be
   * describing the small half of the bill.
   */
  it("counts a stream once it has finished, without disturbing the tokens", async () => {
    const chunks: string[] = [];
    for await (const token of getAiClient("coach-chat").streamChat("sys", [
      { role: "user", content: "hi" },
    ])) {
      chunks.push(token);
    }

    expect(chunks.join("")).toBe("hello");
    expect(record).toHaveBeenCalledWith({
      task: "coach-chat",
      model: "fake-model-1",
      promptTokens: 300,
      completionTokens: 40,
    });
  });

  it("does not record a stream the caller abandoned half way", async () => {
    const stream = getAiClient("coach-chat").streamChat("sys", [{ role: "user", content: "hi" }]);
    await stream.next();
    await stream.return(undefined);

    expect(record).not.toHaveBeenCalled();
  });

  /** A Redis outage must not turn a finished coaching report into an error. */
  it("still returns the result when recording fails", async () => {
    record.mockRejectedValue(new Error("ledger down"));

    await expect(getAiClient("coaching-report").complete("sys", "user")).resolves.toMatchObject({
      content: '{"ok":true}',
    });
  });
});
