import type { AiTier } from "@/lib/ai/client";

/**
 * Every place this product calls a language model, and which tier it runs on.
 *
 * The tier used to be chosen at the call site — `getAiClient()` for the expensive model,
 * `getAiClient("lite")` for the cheap one — spread across eleven files. That made the single
 * biggest lever on the AI bill invisible: nobody could see what the full model was being spent on
 * without reading every service. Naming the tasks here makes the whole spend profile one file, and
 * gives the usage ledger something to attribute cost to.
 *
 * A task belongs on `full` when a weaker model's mistake is not recoverable — either the output is
 * parsed against a strict schema that throws, or it is the product's headline artefact. It belongs
 * on `lite` when the output is short, loosely shaped, and has a non-AI fallback.
 */
export const AI_TASKS = {
  /** The coaching report. The product's headline artefact, parsed against a schema. */
  "coaching-report": "full",

  /** Live conversation with the coach. Held to a higher standard than anything cached. */
  "coach-chat": "full",

  /** A team's weekly report — 1200 tokens of structured analysis for a paying team. */
  "team-report": "full",

  /**
   * Multi-field JSON validated by a Zod schema that `.parse()`s — a shape violation throws and the
   * feature fails, rather than degrading. Stays on `full` for that reason and not because the
   * output is long.
   */
  "otp-assistant": "full",

  /** Same reason as otp-assistant: strict schema, per-item array, `.parse()` throws. */
  "build-explanation": "full",

  /** 250 tokens of prose, cached 7 days, no schema. */
  "matchup-guide": "lite",

  /** 250 tokens, one `{ summary }` field, already wrapped in a catch that returns without it. */
  "champion-deep-dive": "lite",

  /** 120 tokens, falls back to a templated string on any failure. */
  "challenge-description": "lite",

  /** 120 tokens of encouragement. */
  "tilt-message": "lite",

  /** 200 tokens of season summary, cached 7 days. */
  "season-recap": "lite",

  /** 120 tokens describing a death heatmap, cached a day. */
  "heatmap-summary": "lite",
} as const satisfies Record<string, AiTier>;

export type AiTask = keyof typeof AI_TASKS;

export function tierFor(task: AiTask): AiTier {
  return AI_TASKS[task];
}
