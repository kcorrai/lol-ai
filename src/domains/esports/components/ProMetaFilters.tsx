import { ChipRow } from "@/domains/esports/components/ChipRow";
import { PRO_META_ROLES } from "@/domains/esports/proMetaRole";
import { PRO_META_SORTS } from "@/domains/esports/proMetaSort";
import type { ProMetaSort } from "@/domains/esports/proMetaSort";
import type { EsportsLeague, PlayerRole } from "@/domains/esports/types";

interface ProMetaFiltersProps {
  /** The leagues that get a chip, in prominence order. */
  scopes: EsportsLeague[];
  league: EsportsLeague | undefined;
  sort: ProMetaSort;
  role: PlayerRole | null;
  /** Builds the URL for a given combination of the three scopes. */
  href: (leagueSlug: string | undefined, sort: ProMetaSort, role: PlayerRole | null) => string;
}

/**
 * The console above the table: league, lane, order.
 *
 * Links rather than controls, so every view of the table is a URL somebody can
 * send — which is also why the page marks the scoped ones follow-only rather
 * than letting them compete with the canonical table (ADR-017 §3).
 */
export function ProMetaFilters({
  scopes,
  league,
  sort,
  role,
  href,
}: ProMetaFiltersProps): React.ReactElement {
  return (
    <section className="notch grid gap-3 border border-border bg-surface px-4 py-3.5">
      <ChipRow
        label="League"
        ariaLabel="League scope"
        items={[
          { key: "all", label: "All leagues", href: href(undefined, sort, role), active: !league },
          ...scopes.map((scope) => ({
            key: scope.id,
            label: scope.name,
            href: href(scope.slug, sort, role),
            active: league?.id === scope.id,
          })),
        ]}
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line-1 pt-3">
        <ChipRow
          label="Role"
          items={[
            {
              key: "all",
              label: "All",
              href: href(league?.slug, sort, null),
              active: role === null,
            },
            ...PRO_META_ROLES.map((option) => ({
              key: option.key,
              label: option.label,
              href: href(league?.slug, sort, option.key),
              active: role === option.key,
            })),
          ]}
        />
        <ChipRow
          label="Sort"
          items={PRO_META_SORTS.map((option) => ({
            key: option.key,
            label: option.label,
            href: href(league?.slug, option.key, role),
            active: sort === option.key,
          }))}
        />
      </div>
    </section>
  );
}
