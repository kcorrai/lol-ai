"use client";

import { useCallback, useEffect, useState } from "react";
import type { GuessResult, QuizMode } from "@/domains/quiz";

// One mode's play state for one day, kept in localStorage so an anonymous player
// keeps their board on refresh. Signed-in players also get a server-side record
// via /api/quiz/progress; this stays the source of truth for the board itself so
// the game is playable with no account at all.

export interface QuizGameState {
  results: GuessResult[];
  solved: boolean;
  gaveUp: boolean;
  answer?: NonNullable<GuessResult["answer"]>;
}

const EMPTY: QuizGameState = { results: [], solved: false, gaveUp: false };
const PREFIX = "laneiq-quiz";

function storageKey(dateKey: string, mode: QuizMode): string {
  return `${PREFIX}:${dateKey}:${mode}`;
}

function read(dateKey: string, mode: QuizMode): QuizGameState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(storageKey(dateKey, mode));
    return raw ? (JSON.parse(raw) as QuizGameState) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Yesterday's boards are dead weight — a solved puzzle never comes back. */
function pruneOldDays(dateKey: string): void {
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(`${PREFIX}:`) && !key.startsWith(`${PREFIX}:${dateKey}:`)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // A full or blocked localStorage is not worth failing the game over.
  }
}

export function useQuizGame(dateKey: string | undefined, mode: QuizMode, practiceSeed?: string) {
  const [state, setState] = useState<QuizGameState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // A practice round starts empty every time and is never restored: it has no
    // streak, no share card and no reason to outlive the tab.
    if (practiceSeed) {
      setState(EMPTY);
      setError(null);
      return;
    }
    if (!dateKey) return;
    pruneOldDays(dateKey);
    setState(read(dateKey, mode));
    setError(null);
  }, [dateKey, mode, practiceSeed]);

  const persist = useCallback(
    (next: QuizGameState) => {
      setState(next);
      if (!dateKey || practiceSeed) return;
      try {
        window.localStorage.setItem(storageKey(dateKey, mode), JSON.stringify(next));
      } catch {
        // Same as above — losing persistence is survivable, losing the turn is not.
      }
    },
    [dateKey, mode, practiceSeed]
  );

  // Returns the state the turn produced rather than relying on the caller to
  // read it back: React has not re-rendered yet when the promise resolves, so a
  // caller reading `state` in a .then() would see the board as it was before.
  const submit = useCallback(
    async (guess: string): Promise<QuizGameState | null> => {
      if (state.solved || state.gaveUp || pending) return null;
      // Guessing the same champion twice is a slip, not a turn.
      if (state.results.some((r) => r.guess.toLowerCase() === guess.toLowerCase())) {
        setError("You already guessed that one");
        return null;
      }

      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/quiz/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            guess,
            previousGuesses: state.results.map((r) => r.guess),
            ...(practiceSeed ? { practiceSeed } : {}),
          }),
        });
        const json = (await res.json()) as { data?: GuessResult; error?: { message: string } };
        if (!res.ok || !json.data) {
          setError(json.error?.message ?? "That guess could not be checked");
          return null;
        }
        const result = json.data;
        const next: QuizGameState = {
          results: [...state.results, result],
          solved: result.correct,
          gaveUp: false,
          answer: result.answer,
        };
        persist(next);
        return next;
      } catch {
        setError("That guess could not be checked. Check your connection.");
        return null;
      } finally {
        setPending(false);
      }
    },
    [mode, pending, persist, practiceSeed, state]
  );

  const giveUp = useCallback(async (): Promise<QuizGameState | null> => {
    if (state.solved || state.gaveUp) return null;
    setPending(true);
    try {
      const res = await fetch("/api/quiz/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, giveUp: true, ...(practiceSeed ? { practiceSeed } : {}) }),
      });
      const json = (await res.json()) as {
        data?: { answer: NonNullable<GuessResult["answer"]> };
      };
      if (!json.data) return null;
      const next: QuizGameState = { ...state, gaveUp: true, answer: json.data.answer };
      persist(next);
      return next;
    } catch {
      setError("Could not reveal the answer. Check your connection.");
      return null;
    } finally {
      setPending(false);
    }
  }, [mode, persist, practiceSeed, state]);

  const misses = state.results.filter((r) => !r.correct).length;

  return { state, misses, error, pending, submit, giveUp, clearError: () => setError(null) };
}
