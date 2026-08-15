import Link from "next/link";
import Image from "next/image";
import { Share2, TrendingUp, Zap } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Zap,
    label: "Instant Analysis",
    description: "Sync your account once, get insights in seconds.",
  },
  {
    icon: TrendingUp,
    label: "Climb Faster",
    description: "Know exactly what to fix before your next session.",
  },
  {
    icon: Share2,
    label: "Share Your Reports",
    description: "Share coaching reports with your friends or coach.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">Why It Works</p>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Built for Players Who Want to Improve
          </h2>
          <p className="mt-4 text-text-muted">
            Not vague advice. Not generic guides. Your data, your mistakes, your path up.
          </p>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="gaming-card rounded-xl p-5 text-center transition-all duration-200 hover:border-accent/25"
              style={{ boxShadow: "0 0 24px rgba(198,255,61,0.05), inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10"
                style={{ boxShadow: "0 0 20px rgba(198,255,61,0.15)" }}
              >
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <p className="font-semibold text-text">{label}</p>
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            </div>
          ))}
        </div>

        {/* CTA panel with champion splash atmosphere */}
        <div className="relative overflow-hidden rounded-2xl text-center">
          <Image fill alt="" aria-hidden
            src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg"
            className="object-cover object-[50%_20%] opacity-[0.08]"
            style={{ filter: "blur(2px) saturate(0.4)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/90 to-surface/95" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            <div className="absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative px-8 py-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">
              Early Access
            </p>
            <h3 className="font-display text-2xl font-bold text-text md:text-3xl">
              Join Now — Free While We&apos;re in Beta
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-text-muted">
              Help shape the product. Free tier always available.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-md bg-accent px-8 py-3 text-sm font-semibold text-background btn-glow transition-all duration-200"
            >
              Get Started Free
            </Link>
            <p className="mt-3 text-xs text-text-muted">No credit card required</p>
          </div>
        </div>
      </div>
    </section>
  );
}
