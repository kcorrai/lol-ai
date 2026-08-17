"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { OrderDrill } from "@/domains/academy/types";

interface OrderDrillBodyProps {
  drill: OrderDrill;
  locked: boolean;
  onSubmit: (ids: string[]) => void;
}

function move(ids: string[], from: number, to: number): string[] {
  if (to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Reordering without a drag library: two arrows per row. Keyboard-reachable by default,
 * which drag-and-drop would not be, and there are never more than five items.
 */
export function OrderDrillBody({
  drill,
  locked,
  onSubmit,
}: OrderDrillBodyProps): React.ReactElement {
  // The presented order is the declared item order, which the content deliberately writes
  // scrambled — sorting it here would hand the answer over.
  const [order, setOrder] = useState<string[]>(drill.items.map((i) => i.id));

  const label = (id: string): string => drill.items.find((i) => i.id === id)?.label ?? id;
  const correctAt = (id: string, index: number): boolean => drill.correctOrder[index] === id;

  return (
    <div className="mt-4">
      <ol className="flex flex-col gap-1.5">
        {order.map((id, index) => (
          <li
            key={id}
            className={`notch-sm flex items-center gap-3 border px-3 py-2 ${
              locked
                ? correctAt(id, index)
                  ? "border-acid-500 bg-[var(--surface-accent)]"
                  : "border-danger"
                : "border-line-1"
            }`}
          >
            <span className="font-mono text-[11px] text-text-muted">{index + 1}</span>
            <span className="flex-1 text-[13.5px] text-text-body">{label(id)}</span>

            {!locked && (
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={`Move "${label(id)}" up`}
                  disabled={index === 0}
                  onClick={() => setOrder(move(order, index, index - 1))}
                  className="p-1 text-text-muted transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-text-muted"
                >
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label={`Move "${label(id)}" down`}
                  disabled={index === order.length - 1}
                  onClick={() => setOrder(move(order, index, index + 1))}
                  className="p-1 text-text-muted transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-text-muted"
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ol>

      {!locked && (
        <button
          type="button"
          onClick={() => onSubmit(order)}
          className="tag-cut mt-3 h-9 bg-accent px-4 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
        >
          Lock in order
        </button>
      )}
    </div>
  );
}
