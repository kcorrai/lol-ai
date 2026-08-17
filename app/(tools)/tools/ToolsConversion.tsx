import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { championSplashUrl } from "@/lib/ddragon";

function SampleMeter({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[150px] shrink-0 text-xs text-fg-3">{label}</span>
      <span className="well h-1.5 flex-1 bg-surface-dark">
        <span
          className={`block h-1.5 ${danger ? "bg-danger" : "bg-acid-500"}`}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-fg-2">
        {value}
      </span>
    </div>
  );
}

/**
 * One conversion block, at the end, arguing with the product's own output.
 *
 * The tools answer "what is strong"; only a player's own games answer "what am
 * I doing wrong", and that gap is the whole pitch — so the panel shows the
 * shape of a real report rather than listing features. Marked as a sample, the
 * same way the landing page marks its worked example.
 */
export function ToolsConversion(): React.JSX.Element {
  return (
    <section className="notch-lg glow-accent-soft relative mt-8 overflow-hidden border border-acid-500">
      <span
        className="absolute inset-0 bg-cover opacity-25"
        style={{
          backgroundImage: `url('${championSplashUrl("Viego")}')`,
          backgroundPosition: "60% 22%",
        }}
        aria-hidden
      />
      <span className="absolute inset-0 bg-gradient-to-r from-ink-1000 via-ink-1000/85 to-ink-1000/50" />
      <div className="relative grid items-center gap-7 px-7 py-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
            {"// THE TOOLS ARE THE FREE PART"}
          </div>
          <h2 className="mt-3 max-w-[22ch] font-display text-2xl font-black uppercase leading-[1.06] text-fg-1 md:text-3xl">
            These tell you the meta. Only your games tell you what you&apos;re doing wrong.
          </h2>
          <p className="mb-5 mt-3.5 max-w-[52ch] text-[14.5px] text-fg-2">
            Connect a Riot ID and the coach reads your last 20 ranked games — your worst matchups,
            your death timings, and three things to fix.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/register"
              className="notch-sm btn-glow inline-flex items-center gap-2 bg-acid-500 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink-1000 transition-colors hover:bg-acid-400"
            >
              Get my free analysis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="notch border border-border bg-surface px-5 py-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-label text-text-muted">
            {"// SAMPLE OUTPUT"}
          </div>
          <p className="mb-3 font-display text-[15px] font-bold uppercase leading-[1.24] text-fg-1">
            You lose the 20 seconds after full clear
          </p>
          <div className="grid gap-2.5">
            <SampleMeter label="Clear speed" value={78} />
            <SampleMeter label="Vision before fights" value={23} danger />
          </div>
          <div className="mt-3 border-t border-line-1 pt-3 font-mono text-[10.5px] uppercase tracking-wide text-acid-500">
            3 action items · tracked over your next games
          </div>
        </div>
      </div>
    </section>
  );
}
