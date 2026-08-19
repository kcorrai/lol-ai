import type { Metadata } from "next";
import { PricingContent } from "../components/PricingContent";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free, upgrade when ready. Transparent pricing.",
};

export default function PricingPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-10 md:px-8">
      <div className="mb-6">
        <h1 className="m-0 font-display text-4xl font-black uppercase leading-none text-fg-1 md:text-[42px]">
          Pricing
        </h1>
        <p className="mt-3 max-w-[52ch] text-[15px] text-fg-2">
          The free tools stay free. You pay when you want the coach reading your own games.
        </p>
      </div>

      <PricingContent />

      <p className="mt-6 font-mono text-[10px] uppercase tracking-wide text-fg-4">
        Not endorsed by Riot Games · League of Legends © Riot Games, Inc.
      </p>
    </div>
  );
}
