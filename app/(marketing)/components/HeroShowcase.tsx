import Image from "next/image";

const SPLASH = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg";

// Static hero visual (replaced the WebGL/3D scene). Champion splash with a
// floating "AI Coach Insight" card that hints at the product — no client JS.
export function HeroShowcase() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-surface/40">
      <Image
        src={SPLASH}
        alt="League of Legends champion splash art"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover object-[60%_18%]"
        style={{ filter: "saturate(0.9)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />

      {/* Floating product card */}
      <div className="absolute inset-x-4 bottom-4 rounded-xl border border-accent/25 bg-surface/85 p-4 shadow-2xl backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
            AI Coach Insight
          </span>
          <span className="ml-auto text-[10px] text-text-muted">Yasuo · Mid · Gold II</span>
        </div>
        <p className="text-sm italic leading-relaxed text-text">
          &ldquo;Your wave management is costing you winnable lanes. Fix your freeze and the LP follows.&rdquo;
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">+ Roaming</span>
          <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-semibold text-danger">! Wave control</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-text-muted">23s AI analysis</span>
        </div>
      </div>
    </div>
  );
}
