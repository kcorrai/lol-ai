"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { REGIONS } from "@/lib/riot/regions";
import { LANGUAGE_OPTIONS, ROLE_OPTIONS, KIND_OPTIONS } from "@/domains/marketplace/components/options";

const TIER_OPTIONS = [
  { value: "", label: "Any rank" },
  { value: "PLATINUM", label: "Platinum+" },
  { value: "EMERALD", label: "Emerald+" },
  { value: "DIAMOND", label: "Diamond+" },
  { value: "MASTER", label: "Master+" },
];

const SORT_OPTIONS = [
  { value: "rating", label: "Best rated" },
  { value: "price_asc", label: "Cheapest" },
  { value: "price_desc", label: "Most expensive" },
  { value: "newest", label: "Newest" },
];

interface Props {
  filtered: boolean;
  total: number;
}

/**
 * The storefront's filter console.
 *
 * Everything writes straight to the URL rather than to component state, so a
 * filtered view is linkable, shareable, back-buttonable and indexable — which
 * is the whole reason this page is server-rendered from `searchParams` in the
 * first place. Changing a filter always returns to page one; staying on page
 * four of a search that no longer has four pages is the classic way to land
 * somebody on an empty grid.
 */
export function CoachFilters({ filtered, total }: Props): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");

      const qs = next.toString();
      router.push(qs ? `/coaches?${qs}` : "/coaches");
    },
    [params, router]
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select label="Role" value={params.get("role") ?? ""} onChange={(v) => setParam("role", v)}
          options={[{ value: "", label: "Any role" }, ...ROLE_OPTIONS]} />

        <Select label="Session type" value={params.get("kind") ?? ""} onChange={(v) => setParam("kind", v)}
          options={[{ value: "", label: "Any type" }, ...KIND_OPTIONS]} />

        <Select label="Rank" value={params.get("minTier") ?? ""} onChange={(v) => setParam("minTier", v)}
          options={TIER_OPTIONS} />

        <Select label="Language" value={params.get("lang") ?? ""} onChange={(v) => setParam("lang", v)}
          options={[{ value: "", label: "Any language" }, ...LANGUAGE_OPTIONS]} />

        <Select label="Region" value={params.get("region") ?? ""} onChange={(v) => setParam("region", v)}
          options={[{ value: "", label: "Any region" }, ...REGIONS]} />

        <Select label="Sort" value={params.get("sort") ?? "rating"} onChange={(v) => setParam("sort", v)}
          options={SORT_OPTIONS} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-text-muted">
          {total} {total === 1 ? "coach" : "coaches"}
        </p>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={params.get("all") === "1"}
              onChange={(e) => setParam("all", e.target.checked ? "1" : "")}
              className="h-3.5 w-3.5 accent-accent"
            />
            Include coaches not taking students
          </label>

          {filtered && (
            <Link href="/coaches" className="text-xs text-accent hover:underline">
              Clear filters
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <label className="space-y-1">
      <span className="text-xs text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-9 w-full rounded-md border border-border bg-surface-2 px-2 text-sm text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
