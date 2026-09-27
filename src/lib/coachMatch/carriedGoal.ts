// The student's goal, carried from where they said it (the match quiz, an AI
// report) to the booking request they eventually open — across the storefront
// and a profile in between, which have no reason to thread it through their URLs.
//
// Session storage, guarded: a private window or blocked storage throws, and the
// only cost of losing it is an empty box the student fills in themselves.

const KEY = "coaching-goal";

export function rememberGoal(goal: string): void {
  try {
    if (goal) window.sessionStorage.setItem(KEY, goal.slice(0, 500));
  } catch {
    // Nowhere to keep it; the request page starts empty instead.
  }
}

export function recallGoal(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
