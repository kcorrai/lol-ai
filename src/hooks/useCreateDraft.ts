import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { SeriesMode } from "@/domains/draft";

export interface CreateDraftInput {
  team1Name: string;
  team2Name: string;
  mode: SeriesMode;
  gameCount: number;
  timerSeconds: number;
  disabledChampions: string[];
}

export interface CreatedDraft {
  code: string;
  blueToken: string;
  redToken: string;
}

export function useCreateDraft() {
  return useMutation<CreatedDraft, Error, CreateDraftInput>({
    mutationFn: (input) =>
      apiFetch<CreatedDraft>("/api/draft", { method: "POST", body: JSON.stringify(input) }),
  });
}
