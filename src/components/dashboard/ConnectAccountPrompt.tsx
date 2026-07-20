import Link from "next/link";
import { Swords, LineChart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PERKS = [
  { icon: LineChart, label: "Your match history, analyzed automatically" },
  { icon: Sparkles, label: "AI coaching reports built from your own games" },
  { icon: Swords, label: "Champion advice tuned to the current patch" },
] as const;

export function ConnectAccountPrompt() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Swords className="h-6 w-6 text-accent" />
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold text-text">
          Connect your Riot account
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
          Your dashboard fills up the moment we can see your games. Link your Riot ID and we&apos;ll
          pull your match history in the background.
        </p>

        <ul className="mx-auto mt-7 max-w-sm space-y-3 text-left">
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-text-muted">
              <Icon className="h-4 w-4 shrink-0 text-accent" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/settings/accounts">
            <Button size="lg">Connect Riot Account</Button>
          </Link>
          {/* Not everyone is ready to link an account — keep a way out of this page. */}
          <Link
            href="/tools"
            className="text-xs text-text-muted transition-colors hover:text-text"
          >
            Or explore the free tools first
          </Link>
        </div>
      </div>
    </div>
  );
}
