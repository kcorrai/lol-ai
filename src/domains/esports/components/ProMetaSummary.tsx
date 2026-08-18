import Link from "next/link";
import type { ProMeta } from "@/domains/esports/types";

interface ProMetaSummaryProps {
  meta: ProMeta | null;
  /** Patch window, already written the way a patch note names it. */
  patches: string;
  /** The league scope in force, or "All leagues". */
  scope: string;
}

function Row({ term, value }: { term: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{term}</dt>
      <dd className="font-mono text-text">{value}</dd>
    </div>
  );
}

/**
 * What the table is made of, and what it is not evidence for.
 *
 * Both halves are here because a pick rate is meaningless without its sample,
 * and a pro pick rate is actively misleading to a reader who takes it as advice
 * for their own games — so the sample and the caveat sit side by side under it.
 */
export function ProMetaSummary({ meta, patches, scope }: ProMetaSummaryProps): React.ReactElement {
  return (
    <section className="mt-8 grid gap-3.5 md:grid-cols-2">
      <div className="notch glow-accent-soft bg-hero-fade border border-accent bg-surface px-5 py-4">
        <h2 className="mb-2.5 font-display text-base font-extrabold uppercase leading-tight tracking-[0.03em] text-text">
          Pros are not in your rank
        </h2>
        <p className="text-[13.5px] text-text-body">
          What wins a stage game with a coordinated draft is often not what wins yours. The{" "}
          <Link href="/tools/tier-list" className="text-accent hover:underline">
            ranked tier list
          </Link>{" "}
          and every{" "}
          <Link href="/builds" className="text-accent hover:underline">
            champion build
          </Link>{" "}
          are built from solo queue, where the answer is often a different one.
        </p>
      </div>

      <div className="notch border border-border bg-surface px-5 py-4">
        <p className="hud-label mb-3">{"// Sample"}</p>
        <dl className="grid gap-2 text-[13px]">
          <Row term="Games" value={meta ? meta.games : "—"} />
          <Row term="Patches" value={meta ? patches : "—"} />
          <Row term="Champions picked" value={meta ? meta.champions.length : "—"} />
          <Row term="Scope" value={scope} />
        </dl>
      </div>
    </section>
  );
}
