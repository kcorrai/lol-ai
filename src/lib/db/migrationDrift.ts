export interface MigrationDrift {
  /** In `prisma/migrations/`, never applied to this database. */
  missing: string[];
  /** Applied to this database, absent from `prisma/migrations/`. */
  unknown: string[];
}

/**
 * How far apart a checkout and a database have drifted, by migration name.
 *
 * Both directions are reported because they mean different things. `missing` is the ordinary
 * "you have not migrated yet". `unknown` is the interesting one: a database holding migrations
 * this checkout has never heard of is not behind, it is a *different* database — another branch's,
 * or another cluster's.
 *
 * That second case is why this exists. `DATABASE_URL` names a host and a port, never which
 * Postgres cluster is currently listening on that port, so a machine with more than one cluster
 * configured for 5432 can silently serve a months-old copy and answer every query happily
 * (LA-65, and LA-39/LA-40 before it). Comparing migrations is the cheapest signal that the
 * database on the other end is not the one this checkout was working against.
 */
export function compareMigrations(
  onDisk: readonly string[],
  applied: readonly string[]
): MigrationDrift {
  const appliedSet = new Set(applied);
  const onDiskSet = new Set(onDisk);

  return {
    missing: [...onDisk].filter((name) => !appliedSet.has(name)).sort(),
    unknown: [...applied].filter((name) => !onDiskSet.has(name)).sort(),
  };
}

export function isInSync(drift: MigrationDrift): boolean {
  return drift.missing.length === 0 && drift.unknown.length === 0;
}
