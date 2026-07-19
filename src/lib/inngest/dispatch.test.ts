import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();
vi.mock("@/inngest/client", () => ({ inngest: { send: (...args: unknown[]) => send(...args) } }));
vi.mock("@/lib/utils/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { dispatchOrRunInProcess } from "./dispatch";

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
