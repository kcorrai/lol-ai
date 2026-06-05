import { describe, it, expect } from "vitest";
import { buildOtpSystemPrompt, buildOtpUserPrompt } from "./otpPrompt";

describe("buildOtpSystemPrompt", () => {
  it("includes the champion name in the prompt", () => {
    const prompt = buildOtpSystemPrompt("Yasuo");
    expect(prompt).toContain("Yasuo");
  });

  it("conveys OTP expert persona", () => {
    const prompt = buildOtpSystemPrompt("Yasuo");
    expect(prompt.toLowerCase()).toMatch(/otp|uzman|hundreds?|yüzlerce/);
  });

  it("instructs AI to return JSON only", () => {
    const prompt = buildOtpSystemPrompt("Yasuo");
    expect(prompt.toLowerCase()).toContain("json");
  });
});

describe("buildOtpUserPrompt", () => {
  it("includes the champion name in the prompt", () => {
    const prompt = buildOtpUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("Yasuo");
  });

  it("includes hiddenMechanics field", () => {
    const prompt = buildOtpUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("hiddenMechanics");
  });

  it("includes powerSpikes field", () => {
    const prompt = buildOtpUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("powerSpikes");
  });

  it("includes banPriority field", () => {
    const prompt = buildOtpUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("banPriority");
  });

  it("requests easy, medium and hard tier categories", () => {
    const prompt = buildOtpUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("easy");
    expect(prompt).toContain("medium");
    expect(prompt).toContain("hard");
  });

  it("instructs AI to return JSON only", () => {
    const prompt = buildOtpUserPrompt("Yasuo", "MIDDLE");
    expect(prompt.toLowerCase()).toContain("json");
  });

  it("includes the role label in the prompt", () => {
    const midPrompt = buildOtpUserPrompt("Yasuo", "MIDDLE");
    expect(midPrompt.toLowerCase()).toMatch(/mid/);

    const topPrompt = buildOtpUserPrompt("Garen", "TOP");
    expect(topPrompt.toLowerCase()).toMatch(/top/);
  });
});
