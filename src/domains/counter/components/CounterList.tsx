import { CounterCard } from "./CounterCard";
import type { CounterEntry } from "../types/counter.types";

interface CounterListProps {
  title: string;
  entries: CounterEntry[];
}

export function CounterList({ title, entries }: CounterListProps) {
  if (entries.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <CounterCard key={entry.champion} entry={entry} />
        ))}
      </div>
    </section>
  );
}
