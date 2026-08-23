import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    savedSearch: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { archiveFilterSchema } from "@/domains/match/services/matchArchiveFilters";
import {
  deleteSavedSearch,
  listSavedSearches,
  saveSearch,
} from "@/domains/match/services/savedSearchService";

const db = prisma as unknown as {
  savedSearch: Record<string, ReturnType<typeof vi.fn>>;
};

const USER = "user-1";
const NOW = new Date("2026-08-19T10:00:00Z");

function stored(name: string, filters: unknown) {
  return { id: `id-${name}`, name, filters, createdAt: NOW, updatedAt: NOW };
}

beforeEach(() => vi.clearAllMocks());

describe("listSavedSearches", () => {
  it("re-validates stored filters instead of trusting what is in the column", async () => {
    db.savedSearch.findMany.mockResolvedValue([
      stored("Ahri losses", { champions: ["Ahri"], result: "loss", playerSide: "either" }),
    ]);

    const [search] = await listSavedSearches(USER);

    expect(search.name).toBe("Ahri losses");
    expect(search.filters.champions).toEqual(["Ahri"]);
    expect(search.filters.result).toBe("loss");
  });

  it("drops a facet that no longer exists rather than failing the load", async () => {
    // A search saved when the schema had a facet we have since removed.
    db.savedSearch.findMany.mockResolvedValue([
      stored("Old", { champions: ["Zed"], someRetiredFacet: 42, playerSide: "either" }),
    ]);

    const [search] = await listSavedSearches(USER);

    expect(search.filters.champions).toEqual(["Zed"]);
    expect(search.filters).not.toHaveProperty("someRetiredFacet");
  });

  it("skips a row that cannot be salvaged, so one bad search does not cost the others", async () => {
    db.savedSearch.findMany.mockResolvedValue([
      stored("Broken", { result: "not-a-result" }),
      stored("Fine", { result: "win", playerSide: "either" }),
    ]);

    const searches = await listSavedSearches(USER);

    expect(searches.map((s) => s.name)).toEqual(["Fine"]);
  });
});

describe("saveSearch", () => {
  const filters = archiveFilterSchema.parse({ result: "win" });

  it("replaces a search of the same name rather than making a duplicate", async () => {
    db.savedSearch.findUnique.mockResolvedValue({ id: "existing" });
    db.savedSearch.upsert.mockResolvedValue(
      stored("My search", { result: "win", playerSide: "either" })
    );

    await saveSearch(USER, "My search", filters);

    expect(db.savedSearch.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_name: { userId: USER, name: "My search" } } })
    );
    // Replacing must not be counted against the cap.
    expect(db.savedSearch.count).not.toHaveBeenCalled();
  });

  it('trims the name, so "  Ahri  " and "Ahri" are the same search', async () => {
    db.savedSearch.findUnique.mockResolvedValue(null);
    db.savedSearch.count.mockResolvedValue(0);
    db.savedSearch.upsert.mockResolvedValue(
      stored("Ahri", { result: "win", playerSide: "either" })
    );

    await saveSearch(USER, "  Ahri  ", filters);

    expect(db.savedSearch.upsert.mock.calls[0][0].create.name).toBe("Ahri");
  });

  it("refuses a blank name", async () => {
    await expect(saveSearch(USER, "   ", filters)).rejects.toThrow();
    expect(db.savedSearch.upsert).not.toHaveBeenCalled();
  });

  it("refuses a genuinely new search once the player is at the cap", async () => {
    db.savedSearch.findUnique.mockResolvedValue(null);
    db.savedSearch.count.mockResolvedValue(50);

    await expect(saveSearch(USER, "One more", filters)).rejects.toThrow();
    expect(db.savedSearch.upsert).not.toHaveBeenCalled();
  });

  it("still lets an existing search be overwritten at the cap", async () => {
    db.savedSearch.findUnique.mockResolvedValue({ id: "existing" });
    db.savedSearch.upsert.mockResolvedValue(
      stored("At cap", { result: "win", playerSide: "either" })
    );

    await expect(saveSearch(USER, "At cap", filters)).resolves.toMatchObject({ name: "At cap" });
  });
});

describe("deleteSavedSearch", () => {
  it("authorises and deletes in one statement", async () => {
    db.savedSearch.deleteMany.mockResolvedValue({ count: 1 });

    await deleteSavedSearch(USER, "search-1");

    expect(db.savedSearch.deleteMany).toHaveBeenCalledWith({
      where: { id: "search-1", userId: USER },
    });
  });

  it("treats someone else's search as one that does not exist", async () => {
    db.savedSearch.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteSavedSearch(USER, "not-mine")).rejects.toThrow();
  });
});
