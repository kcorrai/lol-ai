import Image from "next/image";
import { championSplashUrl } from "@/lib/ddragon";
import { SectionHead } from "./SectionHead";

interface PoolEntry {
  key: string;
  name: string;
  winRate: string;
  games: string;
  kda: string;
  verdict: string;
  good: boolean;
}

const POOL: readonly PoolEntry[] = [
  { key: "Viego", name: "Viego", winRate: "58%", games: "42 games", kda: "4.1", verdict: "Keep · main", good: true },
  { key: "Khazix", name: "Kha'Zix", winRate: "54%", games: "28 games", kda: "3.6", verdict: "Keep · pocket", good: true },
  { key: "LeeSin", name: "Lee Sin", winRate: "44%", games: "31 games", kda: "2.4", verdict: "Bench", good: false },
  { key: "Nidalee", name: "Nidalee", winRate: "38%", games: "16 games", kda: "2.1", verdict: "Drop", good: false },
];

export function ChampionPoolAudit(): React.ReactElement {
  return (
    <section className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="Champion pool audit" aside="Keep three. Bench the rest." />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {POOL.map((c) => (
            <div
              key={c.key}
              className="notch relative h-[230px] overflow-hidden border border-border"
            >
              <Image
                src={championSplashUrl(c.key)}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 1024px) 50vw, 310px"
                className="object-cover object-[52%_16%] opacity-[0.72]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--ink-1000)_8%,rgba(6,10,9,.15)_62%)]" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-[17px] font-extrabold uppercase tracking-[0.05em] text-text">
                  {c.name}
                </p>
                <div className="mt-1 flex items-baseline gap-2.5">
                  <span
                    className={`font-mono text-xl font-bold ${c.good ? "text-accent" : "text-danger"}`}
                  >
                    {c.winRate}
                  </span>
                  <span className="hud-label">
                    {c.games} · KDA {c.kda}
                  </span>
                </div>
                <p
                  className={`mt-1.5 font-mono text-[10.5px] uppercase tracking-label ${c.good ? "text-accent" : "text-danger"}`}
                >
                  {c.verdict}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
