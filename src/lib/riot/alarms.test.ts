import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({ logger: { error: vi.fn() } }));

import * as Sentry from "@sentry/nextjs";
import { ALARM_WINDOW_MS, raiseRiotAlarm, resetRiotAlarms } from "./alarms";

beforeEach(() => {
  vi.mocked(Sentry.captureMessage).mockReset();
  resetRiotAlarms();
});

describe("raiseRiotAlarm", () => {
  it("reports to Sentry as one issue per alarm and region", () => {
    expect(raiseRiotAlarm("key-rejected", "euw1.api.riotgames.com", { status: 403 }, 0)).toBe(true);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("refused the API key"),
      expect.objectContaining({
        level: "fatal",
        fingerprint: ["riot-alarm", "key-rejected", "euw1.api.riotgames.com"],
      })
    );
  });

  it("sends a burst once, then again after the window", () => {
    raiseRiotAlarm("app-rate-limited", "euw1", {}, 0);
    raiseRiotAlarm("app-rate-limited", "euw1", {}, 1_000);
    raiseRiotAlarm("app-rate-limited", "euw1", {}, ALARM_WINDOW_MS - 1);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);

    raiseRiotAlarm("app-rate-limited", "euw1", {}, ALARM_WINDOW_MS);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2);
  });

  it("throttles each region and each alarm on its own", () => {
    raiseRiotAlarm("app-rate-limited", "euw1", {}, 0);
    raiseRiotAlarm("app-rate-limited", "na1", {}, 0);
    raiseRiotAlarm("key-rejected", "euw1", {}, 0);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(3);
  });
});
