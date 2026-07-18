import Link from "next/link";
import { HeroShowcase } from "./HeroShowcase";
import { StartFreeCta } from "./StartFreeCta";
import { CountUp } from "@/components/ui/CountUp";
import { getMetaSnapshot } from "@/domains/meta";

export async function HeroSection() {
  const snapshot = await getMetaSnapshot();
  const matchCount = snapshot?.matchCount ?? 0;

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Multi-layer background atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        {/* Purple top-left glow */}
        <div className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full bg-[#5846B4]/8 blur-[120px]" />
        {/* Gold center glow */}
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/6 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Free Tools · Match Analysis · Climb Faster
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-text md:text-5xl lg:text-6xl">
              Your Personal{" "}
              <span className="text-accent" style={{ textShadow: "0 0 40px rgba(200,155,60,0.35)" }}>AI Coach</span>{" "}
              for League
            </h1>
            <p className="text-lg leading-relaxed text-text-muted">
              Connect your Riot account and get specific, honest feedback on every match — not
              generic Bronze advice. Track your ranked progress and stop being hardstuck.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <StartFreeCta className="rounded-md bg-accent px-6 py-3 text-center text-sm font-semibold text-background btn-glow transition-all duration-200" />
              <Link
                href="/tools"
                className="rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-text-muted transition-colors hover:border-accent/50 hover:text-text"
              >
                Try the Free Tools
              </Link>
            </div>
            <p className="text-xs text-text-muted">No credit card required · Free plan available</p>

            {matchCount > 0 && (
              <p className="text-xs text-text-muted">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success align-middle" />
                Powered by{" "}
                <CountUp value={matchCount} className="font-semibold text-text" />
                {" "}ranked games analyzed this patch
              </p>
            )}

            {/* Quick stats */}
            <div className="flex gap-6 border-t border-border/60 pt-6">
              {([
                ["Free Tools", "Counters, Matchups, Draft, Tier List"],
                ["AI Reports", "Session analysis & rank roadmap"],
                ["Real Match Data", "Your games, not generic guides"],
              ] as [string, string][]).map(([title, sub]) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-text">{title}</p>
                  <p className="text-[11px] text-text-muted">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3D hextech hero with real splash art */}
          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <div className="pointer-events-none absolute -inset-4 rounded-2xl bg-accent/5 blur-2xl" />
            <HeroShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
