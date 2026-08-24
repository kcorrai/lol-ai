import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { AI_TASKS, tierFor, type AiTask } from "./taskTiers";

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function callSiteTasks(): string[] {
  const found = new Set<string>();
  for (const root of ["src", "app"]) {
    for (const file of walk(root)) {
      // The two modules that define the mechanism rather than use it. Both mention
      // `getAiClient("…")` in prose, which is otherwise indistinguishable from a call.
      if (file.endsWith(join("lib", "ai", "client.ts"))) continue;
      if (file.endsWith(join("lib", "ai", "taskTiers.ts"))) continue;
      for (const m of readFileSync(file, "utf8").matchAll(/getAiClient\(\s*"([^"]+)"\s*\)/g)) {
        found.add(m[1]);
      }
    }
  }
  return [...found].sort();
}

describe("AI task tiers", () => {
  it("resolves a task to its tier", () => {
    expect(tierFor("coaching-report")).toBe("full");
    expect(tierFor("heatmap-summary")).toBe("lite");
  });

  /**
   * The map is only worth having if it is the whole picture. A task added at a call site but not
   * listed here would not compile — `AiTask` is the key union — but a task left *here* after its
   * call site was deleted rots silently, and the next person reading this file to find out what
   * the full model costs would be reading a lie.
   */
  it("lists exactly the tasks that are actually called", () => {
    expect(callSiteTasks()).toEqual(Object.keys(AI_TASKS).sort());
  });

  /**
   * Two of these are on `full` for a reason that is easy to undo by accident: their output is
   * validated by a Zod schema that throws, so a weaker model's shape mistake breaks the feature
   * rather than degrading it. The short-output tasks around them are the ones safe to demote.
   */
  it("keeps the strict-schema tasks on the full tier", () => {
    const strictSchemaTasks: AiTask[] = ["otp-assistant", "build-explanation", "coaching-report"];
    for (const task of strictSchemaTasks) {
      expect(tierFor(task)).toBe("full");
    }
  });
});
