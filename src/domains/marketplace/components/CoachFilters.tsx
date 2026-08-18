"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { REGIONS } from "@/lib/riot/regions";
import {
  LANGUAGE_OPTIONS,
  ROLE_OPTIONS,
  KIND_OPTIONS,
} from "@/domains/marketplace/components/options";

const TIER_OPTIONS = [
  { value: "", label: "Any rank" },
  { value: "PLATINUM", label: "Plat+" },
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
 *
 * Chips rather than dropdowns: the option sets are short enough to show, and a
 * row of chips says what the alternatives are without being opened.
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
    <section className="notch grid gap-3 border border-border bg-surface p-4">
      <ChipRow
        groups={[
          {
            label: "Role",
            param: "role",
            options: [{ value: "", label: "Any role" }, ...ROLE_OPTIONS],
          },
          {
            label: "Type",
            param: "kind",
            options: [{ value: "", label: "Any type" }, ...KIND_OPTIONS],
          },
        ]}
        params={params}
        onSet={setParam}
      />

      <ChipRow
        bordered
        groups={[
          {
            label: "Region",
            param: "region",
            options: [{ value: "", label: "Any region" }, ...REGIONS],
          },
          { label: "Rank", param: "minTier", options: TIER_OPTIONS },
        ]}
        params={params}
        onSet={setParam}
      />

      <ChipRow
        bordered
        groups={[
          {
            label: "Language",
            param: "lang",
            options: [{ value: "", label: "Any language" }, ...LANGUAGE_OPTIONS],
          },
        ]}
        params={params}
        onSet={setParam}
      />

      <div className="flex flex-wrap items-center gap-4 border-t border-line-1 pt-3">
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              active={(params.get("sort") ?? "rating") === option.value}
              onClick={() => setParam("sort", option.value === "rating" ? "" : option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          <input
            type="checkbox"
            checked={params.get("all") === "1"}
            onChange={(e) => setParam("all", e.target.checked ? "1" : "")}
            className="h-3.5 w-3.5 accent-accent"
          />
          Include coaches not taking students
        </label>

        <span className="ml-auto flex items-center gap-3.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
            {total} {total === 1 ? "coach" : "coaches"}
          </span>
          {filtered && (
            <Link
              href="/coaches"
              className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent hover:text-acid-400"
            >
              Clear filters
            </Link>
          )}
        </span>
      </div>
    </section>
  );
}

interface Group {
  label: string;
  param: string;
  options: { value: string; label: string }[];
}

function ChipRow({
  groups,
  params,
  onSet,
  bordered,
}: {
  groups: Group[];
  params: URLSearchParams;
  onSet: (key: string, value: string) => void;
  bordered?: boolean;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        bordered && "border-t border-line-1 pt-3"
      )}
    >
      {groups.map((group, i) => (
        <div key={group.param} className="flex items-center gap-1.5">
          {i > 0 && <span className="mx-1.5 h-5 w-px shrink-0 bg-line-1" aria-hidden />}
          <span className="mr-1 shrink-0 font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
            {group.label}
          </span>
          {group.options.map((option) => (
            <Chip
              key={option.value || "any"}
              active={(params.get(group.param) ?? "") === option.value}
              onClick={() => onSet(group.param, option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "tag-cut shrink-0 border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-line-2 text-text-muted hover:border-line-3 hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
