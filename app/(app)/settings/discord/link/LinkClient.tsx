"use client";

import Link from "next/link";
import { useState } from "react";

type State =
  | { status: "idle" | "saving" }
  | { status: "done" }
  | { status: "error"; message: string };

export default function LinkClient({
  token,
  discordUsername,
}: {
  token: string;
  discordUsername: string;
}) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function confirm(): Promise<void> {
    setState({ status: "saving" });
    try {
      const res = await fetch("/api/discord/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setState({ status: "error", message: json.error?.message ?? "Linking failed" });
        return;
      }
      setState({ status: "done" });
    } catch {
      setState({
        status: "error",
        message: "Linking failed. Check your connection and try again.",
      });
    }
  }

  if (state.status === "done") {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold text-text">Discord linked</h1>
        <p className="text-sm text-text-muted">
          <strong className="text-text">{discordUsername}</strong> is connected. Back in Discord,
          commands like <code>/rank</code> now work without a Riot ID.
        </p>
        <Link href="/settings/discord" className="text-sm text-accent hover:underline">
          Back to Discord settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Link Discord</h1>
        <p className="mt-1 text-sm text-text-muted">
          Connect a Discord account to this profile so the bot can answer for you.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-text">
          Discord account: <strong>{discordUsername}</strong>
        </p>
        <p className="text-xs text-text-muted">
          Only confirm if you started this from <code>/lolai link</code> yourself. Linking lets that
          Discord account look up your rank and coaching without typing a Riot ID.
        </p>
        <button
          onClick={confirm}
          disabled={state.status === "saving"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {state.status === "saving" ? "Linking…" : "Confirm link"}
        </button>
        {state.status === "error" && <p className="text-xs text-danger">❌ {state.message}</p>}
      </div>
    </div>
  );
}
