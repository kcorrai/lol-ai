import { z } from "zod";

export interface ItemExplanation {
  itemName: string;
  wasGoodChoice: boolean;
  reasoning: string;
  betterAlternative: string | null;
  whenToChoose: string;
}

export interface BuildExplanation {
  summary: string;
  items: ItemExplanation[];
  buildPath: string;
  biggestMistake: string | null;
  generatedAt: string;
}

const itemExplanationSchema = z.object({
  itemName: z.string(),
  wasGoodChoice: z.boolean(),
  reasoning: z.string(),
  betterAlternative: z.string().nullable(),
  whenToChoose: z.string(),
});

export const buildExplanationAiOutputSchema = z.object({
  summary: z.string(),
  items: z.array(itemExplanationSchema).min(1),
  buildPath: z.string(),
  biggestMistake: z.string().nullable(),
});

export const buildExplanationSchema = buildExplanationAiOutputSchema.extend({
  generatedAt: z.string(),
});
