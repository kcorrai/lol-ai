import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import {
  archiveFilterSchema,
  type ArchiveFilters,
} from "@/domains/match/services/matchArchiveFilters";

export type SavedSearchSummary = {
  id: string;
  name: string;
  filters: ArchiveFilters;
  createdAt: string;
  updatedAt: string;
};

const MAX_PER_USER = 50;
const MAX_NAME_LENGTH = 60;

/**
 * Stored filters are re-validated on the way out, never trusted as written.
 *
 * They are JSON in the database, so the row is whatever the schema looked like when it was saved.
 * Parsing it through the current `archiveFilterSchema` is what lets a search saved before a facet
 * existed still load: unknown keys fall away and the rest survives. A row that cannot be salvaged
 * at all is dropped from the list rather than failing the whole request — one bad row must not
 * cost the player every other search they saved.
 */
function toSummary(row: {
  id: string;
  name: string;
  filters: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SavedSearchSummary | null {
  const parsed = archiveFilterSchema.safeParse(row.filters);
  if (!parsed.success) return null;
  return {
    id: row.id,
    name: row.name,
    filters: parsed.data,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listSavedSearches(userId: string): Promise<SavedSearchSummary[]> {
  const rows = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_USER,
    select: { id: true, name: true, filters: true, createdAt: true, updatedAt: true },
  });
  return rows.map(toSummary).filter((s): s is SavedSearchSummary => s !== null);
}

export async function saveSearch(
  userId: string,
  name: string,
  filters: ArchiveFilters
): Promise<SavedSearchSummary> {
  const trimmed = name.trim();
  if (!trimmed) throw Errors.validation("A saved search needs a name");
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw Errors.validation(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
  }

  // Counted before the upsert so replacing an existing name is never refused for being over the
  // cap — only genuinely new searches can push a player over it.
  const existing = await prisma.savedSearch.findUnique({
    where: { userId_name: { userId, name: trimmed } },
    select: { id: true },
  });
  if (!existing && (await prisma.savedSearch.count({ where: { userId } })) >= MAX_PER_USER) {
    throw Errors.validation(`You can keep up to ${MAX_PER_USER} saved searches`);
  }

  const row = await prisma.savedSearch.upsert({
    where: { userId_name: { userId, name: trimmed } },
    create: { userId, name: trimmed, filters },
    update: { filters },
    select: { id: true, name: true, filters: true, createdAt: true, updatedAt: true },
  });

  // The row was just written from a validated object, so this cannot fail — but the types say it
  // can, and inventing a cast to say otherwise would be the lie.
  const summary = toSummary(row);
  if (!summary) throw Errors.validation("Filters could not be stored");
  return summary;
}

export async function deleteSavedSearch(userId: string, id: string): Promise<void> {
  // Scoped by userId in the same statement rather than fetch-then-check, so one query both
  // authorises and deletes.
  const { count } = await prisma.savedSearch.deleteMany({ where: { id, userId } });
  if (count === 0) throw Errors.notFound("Saved search");
}
