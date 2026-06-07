import type { Metadata } from "next";
import { HeroSection } from "./components/HeroSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { ToolsShowcaseSection } from "./components/ToolsShowcaseSection";
import { ToolsShowcaseSection2 } from "./components/ToolsShowcaseSection2";
import { FeaturesSection } from "./components/FeaturesSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { DemoSearchBox } from "@/components/landing/DemoSearchBox";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LoL AI Coach — AI-Powered League of Legends Coaching",
  description:
    "Connect your Riot account. Get specific, honest feedback on what's holding you back. Stop being hardstuck.",
  openGraph: {
    title: "LoL AI Coach — AI-Powered League of Legends Coaching",
    description:
      "Connect your Riot account. Get specific, honest feedback on what's holding you back. Stop being hardstuck.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      {/* Frictionless Demo */}
      <section className="relative overflow-hidden bg-background py-20">
        {/* Background: subtle grid + centered glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute left-1/2 top-1/2 h-[480px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6">
          {/* Heading */}
          <div className="mb-10 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Hemen Dene — Kayıt Gerekmez
            </div>
            <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
              Kendi Hesabını{" "}
              <span className="text-accent">Analiz Et</span>
            </h2>
            <p className="mt-3 text-sm text-text-muted md:text-base">
              Riot ID&apos;ni gir, AI koçunun neler söyleyeceğini gör.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 shadow-2xl backdrop-blur-sm ring-1 ring-inset ring-white/5">
            <DemoSearchBox />
          </div>

          {/* Trust signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted">
            {[
              "Tamamen ücretsiz",
              "Kayıt gerekmez",
              "30 saniyede sonuç",
              "AI destekli analiz",
            ].map((label) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="text-success">✓</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <ToolsShowcaseSection />
      <ToolsShowcaseSection2 />
      <FeaturesSection />
      <TestimonialsSection />

      {/* Final CTA */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Ready to Stop Being Hardstuck?
          </h2>
          <p className="mt-4 text-text-muted">
            Join players who are using AI to climb faster. Free tier available — no credit card
            required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-md bg-accent px-8 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-border px-8 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent/50 hover:text-text"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
