import { DemoVideo } from "@/components/ui/DemoVideo";

// "See it in action" — the locally-rendered product walkthrough video.
export function DemoVideoSection(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden bg-surface/40 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent" />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">See it in action</p>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">From Riot ID to a climb plan</h2>
          <p className="mt-3 text-text-muted">Watch how one session turns into specific, personal coaching.</p>
        </div>

        <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <DemoVideo className="aspect-video w-full" />
        </div>
      </div>
    </section>
  );
}
