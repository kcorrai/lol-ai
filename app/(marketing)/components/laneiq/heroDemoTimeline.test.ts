import { describe, it, expect } from "vitest";
import {
  DEMO_EVENTS,
  DEMO_FINAL,
  DEMO_LOOP_MS,
  DEMO_MATCHES,
  DEMO_RIOT_ID,
  demoFrame,
  stepIndex,
} from "./heroDemoTimeline";

const TYPE_MS = DEMO_RIOT_ID.length * 90;
const PULL_START = TYPE_MS;
const PARSE_START = PULL_START + DEMO_MATCHES.length * 130;
const GRADE_START = PARSE_START + 1300;
const VERDICT_START = GRADE_START + 1300;

/** Every frame in one loop, sampled at the clock's own tick. */
function sampleLoop(): ReturnType<typeof demoFrame>[] {
  const frames = [];
  for (let t = 0; t < DEMO_LOOP_MS; t += 90) frames.push(demoFrame(t));
  return frames;
}

describe("demoFrame", () => {
  it("types the Riot ID one character at a time", () => {
    expect(demoFrame(0).typed).toBe("K");
    expect(demoFrame(90 * 3).typed).toBe("Kayj");
    expect(demoFrame(TYPE_MS - 1)).toMatchObject({ stage: "typing", typed: DEMO_RIOT_ID });
  });

  it("fetches the ten games one by one", () => {
    expect(demoFrame(PULL_START)).toMatchObject({ stage: "pulling", matches: 1 });
    expect(demoFrame(PARSE_START - 1)).toMatchObject({ stage: "pulling", matches: 10 });
  });

  it("counts timeline events up to the sample report's total", () => {
    const mid = demoFrame(PARSE_START + 650);
    expect(mid.stage).toBe("parsing");
    expect(mid.events).toBeGreaterThan(0);
    expect(mid.events).toBeLessThan(DEMO_EVENTS);
    expect(demoFrame(GRADE_START).events).toBe(DEMO_EVENTS);
  });

  it("fills the grades, then reveals the verdict a line at a time", () => {
    expect(demoFrame(GRADE_START + 650).grading).toBeGreaterThan(0);
    expect(demoFrame(GRADE_START + 650).verdictLines).toBe(0);
    expect(demoFrame(VERDICT_START).verdictLines).toBe(1);
    expect(demoFrame(VERDICT_START + 450).verdictLines).toBe(2);
    expect(demoFrame(VERDICT_START + 2000)).toEqual(DEMO_FINAL);
  });

  it("starts over when the loop ends", () => {
    expect(demoFrame(DEMO_LOOP_MS)).toEqual(demoFrame(0));
  });

  it("never goes backwards within a loop", () => {
    const frames = sampleLoop();
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].typed.length).toBeGreaterThanOrEqual(frames[i - 1].typed.length);
      expect(frames[i].matches).toBeGreaterThanOrEqual(frames[i - 1].matches);
      expect(frames[i].grading).toBeGreaterThanOrEqual(frames[i - 1].grading);
      expect(frames[i].verdictLines).toBeGreaterThanOrEqual(frames[i - 1].verdictLines);
    }
  });

  it("keeps the games at the sample report's 4W 6L", () => {
    expect(DEMO_MATCHES.filter((m) => m.win)).toHaveLength(4);
  });
});

describe("stepIndex", () => {
  it("maps each working stage to its line and the rest to none", () => {
    expect(stepIndex("pulling")).toBe(0);
    expect(stepIndex("parsing")).toBe(1);
    expect(stepIndex("grading")).toBe(2);
    expect(stepIndex("typing")).toBeNull();
    expect(stepIndex("done")).toBeNull();
  });
});
