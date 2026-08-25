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

  // The failure this is here for: each bucket described its contents in prose while every
  // other list in the skeleton showed an example object. The model copied the skeleton, all
  // fifteen matchups came back as strings, and `otpAiOutputSchema` threw on every request —
  // a 500 from the assistant every time it was asked, on the site and in the desktop app.
  //
  // Asserting the field names appear *somewhere* is what let it through: they did, in a
  // sentence twenty lines below the skeleton the model was copying. This asserts they appear
  // inside each bucket, which is the only place that changes what comes back.
  it("shows the matchup card's shape inside each tier, not beside it", () => {
    const prompt = buildOtpUserPrompt("Yasuo", "MIDDLE");

    for (const tier of ["easy", "medium", "hard"] as const) {
      const bucket = prompt.slice(prompt.indexOf(`"${tier}": [`));
      const contents = bucket.slice(0, bucket.indexOf("]"));

      expect([tier, contents.includes(`"opponent"`)]).toEqual([tier, true]);
      expect([tier, contents.includes(`"difficulty": "${tier}"`)]).toEqual([tier, true]);
      expect([tier, contents.includes(`"keyTip"`)]).toEqual([tier, true]);
    }
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
