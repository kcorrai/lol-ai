import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();
vi.mock("@/inngest/client", () => ({ inngest: { send: (...args: unknown[]) => send(...args) } }));
vi.mock("@/lib/utils/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/logger";
import { dispatchOrReport, dispatchOrRunInProcess } from "./dispatch";

const EVENT = { name: "test/event", data: {} } as never;

describe("dispatchOrRunInProcess", () => {
  beforeEach(() => {
    send.mockReset();
  });

  it("dispatches via Inngest and does NOT run in-process when send succeeds", async () => {
    send.mockResolvedValueOnce({ ids: ["1"] });
    const inProcess = vi.fn().mockResolvedValue(undefined);

    await dispatchOrRunInProcess(EVENT, inProcess);

    expect(send).toHaveBeenCalledOnce();
    expect(inProcess).not.toHaveBeenCalled();
  });

  it("falls back to in-process when Inngest send throws", async () => {
    send.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    let ran = false;
    const inProcess = vi.fn(async () => { ran = true; });

    await dispatchOrRunInProcess(EVENT, inProcess);
    await Promise.resolve(); // let the fire-and-forget microtask settle

    expect(inProcess).toHaveBeenCalledOnce();
    expect(ran).toBe(true);
  });

  it("never rejects even if the in-process fallback also throws", async () => {
    send.mockRejectedValueOnce(new Error("down"));
    const inProcess = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(dispatchOrRunInProcess(EVENT, inProcess)).resolves.toBeUndefined();
  });
});

// The other half of the same problem, and the one LA-66 was about. Some events have nowhere
// to fall back to: when their send fails the work is simply gone, and the only thing left to
// get right is that somebody finds out.
describe("dispatchOrReport", () => {
  const BATCH = [
    { name: "tilt/check-streak", data: {} },
    { name: "snapshot/compute", data: {} },
  ] as never;

  beforeEach(() => {
    send.mockReset();
    vi.mocked(logger.error).mockClear();
    vi.mocked(Sentry.captureException).mockClear();
  });

  it("sends the batch as one call and reports success", async () => {
    send.mockResolvedValueOnce({ ids: ["1", "2"] });

    expect(await dispatchOrReport(BATCH, "sync")).toBe(true);
    expect(send).toHaveBeenCalledOnce();
    expect(logger.error).not.toHaveBeenCalled();
  });

  // It was a `logger.warn` until LA-66, where the reason a feature had never worked locally
  // turned out to have been sitting in that line unread for weeks.
  it("logs at error level and captures when the send fails", async () => {
    send.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    expect(await dispatchOrReport(BATCH, "sync")).toBe(false);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(Sentry.captureException).toHaveBeenCalledOnce();
  });

  it("names the jobs that were lost, so the log says what is owed", async () => {
    send.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    await dispatchOrReport(BATCH, "sync");

    const [message] = vi.mocked(logger.error).mock.calls[0];
    expect(message).toContain("tilt/check-streak");
    expect(message).toContain("snapshot/compute");
    expect(message).toContain("sync");
    const [, options] = vi.mocked(Sentry.captureException).mock.calls[0];
    expect((options as { extra: { events: string[] } }).extra.events).toEqual([
      "tilt/check-streak",
      "snapshot/compute",
    ]);
  });

  it("handles a single event as well as a batch", async () => {
    send.mockRejectedValueOnce(new Error("down"));

    await dispatchOrReport({ name: "one/event", data: {} } as never, "somewhere");

    expect(vi.mocked(logger.error).mock.calls[0][0]).toContain("one/event");
  });

  // The caller has already done the work these events are about. Failing its request because a
  // follow-up job could not be queued would turn a degraded background path into a broken
  // foreground one.
  it("never rejects", async () => {
    send.mockRejectedValueOnce(new Error("down"));
    await expect(dispatchOrReport(BATCH, "sync")).resolves.toBe(false);
  });
});
