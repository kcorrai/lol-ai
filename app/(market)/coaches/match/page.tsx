import type { Metadata } from "next";
import Link from "next/link";
import { FindCoachQuiz } from "@/domains/marketplace/components/FindCoachQuiz";

export const metadata: Metadata = {
  title: "Find the right League of Legends coach",
  description:
    "Six quick questions — your role, your rank, what you want to fix — and we show the coaches who fit.",
  alternates: { canonical: "/coaches/match" },
};

export default function FindMyCoachPage() {
  return (
    <div className="mx-auto max-w-[860px] px-5 pb-16 pt-8 md:px-8">
      <nav className="text-[12px] text-text-faint" aria-label="Breadcrumb">
        <Link href="/coaches" className="text-text-muted hover:text-accent">
          Coaches
        </Link>{" "}
        / <span className="text-text-body">Find my coach</span>
      </nav>
      <h1 className="mt-4 font-display text-[30px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[40px]">
        Find the right coach
      </h1>
      <p className="mb-7 mt-4 max-w-[58ch] text-[15px] leading-relaxed text-text-body">
        Tell us where you are and what you want to fix. We show coaches whose checked rank is above
        yours, in your role and language, within your budget.
      </p>
      <FindCoachQuiz />
    </div>
  );
}
