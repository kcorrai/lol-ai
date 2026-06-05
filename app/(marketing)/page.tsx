import type { Metadata } from "next";
import { HeroSection } from "./components/HeroSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { ToolsShowcaseSection } from "./components/ToolsShowcaseSection";
import { ToolsShowcaseSection2 } from "./components/ToolsShowcaseSection2";
import { FeaturesSection } from "./components/FeaturesSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
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
