import Image from "next/image";
import { championSplashUrl } from "@/lib/ddragon";
import { AnalyzeForm } from "./AnalyzeForm";

// The hero's ask, repeated at the bottom for readers who scrolled the whole page.
// It renders its own result — sending the reader back up to the hero for it was
// the reason this form appeared to do nothing.
export function ClosingSplash(): React.ReactElement {
  return (
    <section className="relative mt-16 flex min-h-[320px] items-center overflow-hidden border-t border-border md:mt-[72px]">
      <Image
        src={championSplashUrl("Ambessa")}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover object-[50%_26%] opacity-[0.45]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ink-1000)_12%,rgba(6,10,9,.35)_100%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 py-12 md:px-8">
        <h2 className="mb-[18px] max-w-[16ch] font-display text-[32px] font-black uppercase text-text md:text-[42px]">
          Stop guessing what to fix
        </h2>
        <AnalyzeForm />
      </div>
    </section>
  );
}
