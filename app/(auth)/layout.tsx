import Link from "next/link";
import { AuthArt } from "./components/AuthArt";
import { Wordmark } from "../(marketing)/components/laneiq/Wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
      <AuthArt />

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[432px]">
          {/* The art panel is the brand on a wide screen. Below it, this is. */}
          <div className="mb-8 flex items-center gap-3.5 lg:hidden">
            <Wordmark size={17} />
            <span className="h-4 w-px bg-line-2" />
            <span className="font-mono text-[10px] uppercase tracking-label text-text-muted">
              Ranked review
            </span>
          </div>

          {children}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-faint">
            <span>Free tools stay open · no account needed</span>
            <Link href="/tools/tier-list" className="text-text-muted hover:text-accent">
              Browse tier list &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
