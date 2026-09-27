"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGIONS } from "@/lib/riot/regions";
import {
  LANGUAGE_OPTIONS,
  ROLE_OPTIONS,
  KIND_OPTIONS,
} from "@/domains/marketplace/components/options";
import { FilterSelect } from "@/domains/marketplace/components/FilterSelect";
import type { FilterOption } from "@/domains/marketplace/components/FilterSelect";
import { RoleIcon } from "@/domains/marketplace/components/hud/RoleIcon";

const TIER_OPTIONS: FilterOption[] = [
  { value: "", label: "Any rank" },
  { value: "PLATINUM", label: "Plat+" },
  { value: "EMERALD", label: "Emerald+" },
  { value: "DIAMOND", label: "Diamond+" },
  { value: "MASTER", label: "Master+" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "", label: "Best rated" },
  { value: "price_asc", label: "Cheapest" },
  { value: "price_desc", label: "Most expensive" },
  { value: "newest", label: "Newest" },
];

const SELECTS: { label: string; param: string; options: FilterOption[] }[] = [
  {
    label: "Session type",
    param: "kind",
    options: [{ value: "", label: "Any type" }, ...KIND_OPTIONS],
  },
  { label: "Region", param: "region", options: [{ value: "", label: "Any region" }, ...REGIONS] },
  { label: "Rank", param: "minTier", options: TIER_OPTIONS },
  {
    label: "Language",
    param: "lang",
    options: [{ value: "", label: "Any language" }, ...LANGUAGE_OPTIONS],
  },
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
 * Role is the one question every student arrives with, so it stays a row of
 * visible buttons with the game's own icons. The long lists (regions,
 * languages) fold into selects, and whatever is set is echoed back as chips
 * that each undo one choice.
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

  const role = params.get("role") ?? "";
  const active = [
    ...(role ? [{ param: "role", label: labelOf(ROLE_OPTIONS, role) }] : []),
    ...SELECTS.filter((s) => params.get(s.param)).map((s) => ({
      param: s.param,
      label: labelOf(s.options, params.get(s.param) ?? ""),
    })),
    ...(params.get("all") === "1" ? [{ param: "all", label: "Incl. paused coaches" }] : []),
  ];

  return (
    <section className="notch border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 p-3 md:p-4">
        <div
          role="group"
          aria-label="Role"
          className="flex w-full gap-1 overflow-x-auto [scrollbar-width:none] sm:w-auto [&::-webkit-scrollbar]:hidden"
        >
          <RoleButton active={role === ""} onClick={() => setParam("role", "")}>
            All roles
          </RoleButton>
          {ROLE_OPTIONS.map((option) => (
            <RoleButton
              key={option.value}
              active={role === option.value}
              onClick={() => setParam("role", option.value)}
            >
              <RoleIcon role={option.value} labelled size={18} />
            </RoleButton>
          ))}
        </div>

        <FilterSelect
          label="Sort by"
          value={params.get("sort") ?? ""}
          options={SORT_OPTIONS}
          onChange={(value) => setParam("sort", value)}
          className="w-full sm:w-44"
        />
      </div>

      <div className="grid gap-2.5 p-3 sm:grid-cols-2 md:p-4 lg:grid-cols-4">
        {SELECTS.map((select) => (
          <FilterSelect
            key={select.param}
            label={select.label}
            value={params.get(select.param) ?? ""}
            options={select.options}
            onChange={(value) => setParam(select.param, value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line-1 px-3 py-3 md:px-4">
        <span className="mr-1 text-[13px] text-text">
          <span className="font-mono font-bold text-accent">{total}</span>{" "}
          {total === 1 ? "coach" : "coaches"}
        </span>

        {active.map((chip) => (
          <button
            key={chip.param}
            type="button"
            onClick={() => setParam(chip.param, "")}
            className="tag-cut inline-flex items-center gap-1.5 border border-accent/40 bg-accent/10 py-1 pl-2.5 pr-2 text-[12px] text-accent transition-colors hover:bg-accent/20"
            aria-label={`Remove filter: ${chip.label}`}
          >
            {chip.label}
            <X className="h-3 w-3" aria-hidden />
          </button>
        ))}

        {filtered && (
          <Link
            href="/coaches"
            className="text-[12.5px] text-text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Clear filters
          </Link>
        )}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-[12.5px] text-text-muted hover:text-text">
          <input
            type="checkbox"
            checked={params.get("all") === "1"}
            onChange={(e) => setParam("all", e.target.checked ? "1" : "")}
            className="h-3.5 w-3.5 accent-accent"
          />
          Include coaches not taking students
        </label>
      </div>
    </section>
  );
}

function labelOf(options: ReadonlyArray<FilterOption>, value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function RoleButton({
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
        "tag-cut flex h-10 shrink-0 items-center border px-3 text-[13px] transition-colors",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-transparent text-text-body hover:border-line-2 hover:bg-surface-2 hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
