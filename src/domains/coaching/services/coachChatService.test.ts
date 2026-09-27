import { describe, it, expect, vi, beforeEach } from "vitest";

const streamChat = vi.fn();

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(() => ({ streamChat })),
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/domains/analysis/services/matchAnalysisService", () => ({
  getPlayerPerformanceProfile: vi.fn(),
}));
vi.mock("@/domains/analysis/services/improvementPlanService", () => ({
  getActivePlan: vi.fn(),
}));

import {
  createCoachChatStream,
  recentChatHistory,
} from "@/domains/coaching/services/coachChatService";
import type { ChatMessage } from "@/lib/ai/types";

function transcript(length: number): ChatMessage[] {
  return Array.from({ length }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `message ${i}`,
  }));
}

async function drain(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

beforeEach(() => {
  streamChat.mockReset();
  streamChat.mockImplementation(async function* () {
    yield "ok";
  });
});

describe("recentChatHistory", () => {
  it("passes a short conversation through unchanged", () => {
    const messages = transcript(5);
    expect(recentChatHistory(messages)).toEqual(messages);
  });

  it("keeps only the last twelve messages of a long conversation", () => {
    const recent = recentChatHistory(transcript(30));

    expect(recent).toHaveLength(12);
    expect(recent.at(-1)?.content).toBe("message 29");
  });

  it("drops a leading assistant message so the history opens with the player", () => {
    const recent = recentChatHistory(transcript(31));

    expect(recent[0].role).toBe("user");
    expect(recent).toHaveLength(11);
    expect(recent.at(-1)?.content).toBe("message 30");
  });
});

describe("createCoachChatStream", () => {
  it("sends the model the trimmed history, not the whole transcript", async () => {
    const output = await drain(createCoachChatStream("system", transcript(31)));

    expect(output).toBe("ok");
    expect(streamChat).toHaveBeenCalledWith("system", recentChatHistory(transcript(31)));
    expect(streamChat.mock.calls[0][1]).toHaveLength(11);
  });
});
