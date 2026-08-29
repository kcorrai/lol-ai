import type { ReactNode } from "react";
import { Zap } from "lucide-react";

/**
 * The window before this machine has an account.
 *
 * An unpaired app can fill three of its seventeen screens and none of its coaching. Every
 * lifted screen reads the website through a device token this machine does not hold yet, so
 * each one drew the same sentence pointing at a fourth screen — and the sidebar carried
 * fourteen rows whose only behaviour was to show it again. A rail of dead rows is not a
 * menu; it is a list of the things that do not work, offered in the one moment the player
 * has no way to tell which ones ever will.
 *
 * So there is no rail and no router until the pairing exists: one screen, which is the only
 * one with anything to do on it. The navigation arrives with the account.
 *
 * The bar is the same eleven pixels of `AppFrame`'s, carrying the brand rather than the
 * chips — an account chip on the screen whose whole subject is not having an account would
 * be saying the same thing twice.
 */
export function SetupFrame({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line-1 bg-surface-dark px-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
          <Zap className="h-4 w-4 text-accent" aria-hidden />
        </div>
        <span className="truncate font-display text-sm font-bold tracking-wide text-text">
          LoL AI&nbsp;<span className="text-accent">Coach</span>
        </span>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-2xl gap-5 p-6">
          <div>
            <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-text">
              {title}
            </h1>
            <p className="mt-1.5 max-w-[58ch] text-sm text-text-body">{lede}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
