import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { championSplashUrl } from "@/lib/ddragon";
import { PublicOnly } from "@/components/tools/PublicOnly";

interface ToolCtaProps {
  eyebrow: string;
  title: string;
  body: string;
  /** Data Dragon id whose splash washes the panel — the champion the page is about, if any. */
  splashKey?: string;
  cta?: string;
}

/**
 * The sign-up panel at the foot of a tool, for logged-out visitors only.
 *
 * Each tool keeps its own argument (the copy is passed in); what they share is the frame — the
 * same accent panel the tools hub ends on, so the pitch reads as part of the product.
 */
export function ToolCta({
  eyebrow,
  title,
  body,
  splashKey = "Viego",
  cta = "Get my free analysis",
}: ToolCtaProps): React.ReactElement {
  return (
    <PublicOnly>
      <section className="notch-lg glow-accent-soft relative mt-12 overflow-hidden border border-acid-500">
        <span
          className="absolute inset-0 bg-cover opacity-20"
          style={{
            backgroundImage: `url('${championSplashUrl(splashKey)}')`,
            backgroundPosition: "60% 22%",
          }}
          aria-hidden
        />
        <span className="absolute inset-0 bg-gradient-to-r from-ink-1000 via-ink-1000/90 to-ink-1000/55" />
        <div className="relative px-7 py-7">
          <div className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
            {`// ${eyebrow}`}
          </div>
          <h2 className="mt-3 max-w-[30ch] font-display text-2xl font-black uppercase leading-[1.06] text-fg-1">
            {title}
          </h2>
          <p className="mb-5 mt-3 max-w-[56ch] text-[14.5px] text-fg-2">{body}</p>
          <Link
            href="/register"
            className="notch-sm btn-glow inline-flex items-center gap-2 bg-acid-500 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink-1000 transition-colors hover:bg-acid-400"
          >
            {cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </PublicOnly>
  );
}
