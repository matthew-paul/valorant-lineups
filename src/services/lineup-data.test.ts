import { API_URL, localStorageExpirationTime } from "../component-utils/constants";
import { makeLineup } from "../test-utils/lineup-fixtures";
import type { LineupStorage } from "./lineup-data";
import {
  arrowsForCluster,
  clusterLineups,
  fetchLineups,
  filterLineups,
  flattenLineups,
  getBrowserStorage,
  groupLineupsByMap,
  invalidateLineupCache,
  isLineupRecord,
  loadLineups,
  parseHiddenMarkerIds,
  parseLineupCache,
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "./lineup-data";

class MemoryStorage implements LineupStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const responseWith = (
  body: unknown,
  options: { ok?: boolean; status?: number } = {}
): Response =>
  ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: async () => body,
  } as Response);

describe("lineup data boundaries", () => {
  test("validates the complete runtime record shape", () => {
    expect(isLineupRecord(makeLineup())).toBe(true);
    expect(isLineupRecord({ ...makeLineup(), startX: "300" })).toBe(false);
    expect(isLineupRecord({ ...makeLineup(), tags: [1, "5"] })).toBe(false);
  });

  test("groups and flattens records without changing bucket order", () => {
    const ascentOne = makeLineup({ id: "a" });
    const bind = makeLineup({ id: "b", mapId: 2 });
    const ascentTwo = makeLineup({ id: "c" });

    const grouped = groupLineupsByMap([ascentOne, bind, ascentTwo]);

    expect(grouped).toEqual({
      1: [ascentOne, ascentTwo],
      2: [bind],
    });
    expect(flattenLineups(grouped)).toEqual([ascentOne, ascentTwo, bind]);
  });

  test.each([
    ["missing records", null, "100"],
    ["missing timestamp", "{}", null],
    ["nonnumeric timestamp", "{}", "never"],
    ["empty timestamp", "{}", ""],
    ["whitespace timestamp", "{}", " "],
    ["future timestamp", "{}", "501"],
    ["malformed JSON", "{", "100"],
    ["invalid record shape", '{"1":[{"id":"bad"}]}', "100"],
  ])("refreshes a %s cache", (_name, records, timestamp) => {
    expect(parseLineupCache(records, timestamp, 1000, 500)).toEqual({
      lineups: null,
      shouldRefresh: true,
    });
  });

  test("treats the exact expiration boundary as stale", () => {
    const grouped = groupLineupsByMap([makeLineup()]);
    expect(
      parseLineupCache(JSON.stringify(grouped), "1000", 500, 1500)
        .shouldRefresh
    ).toBe(true);
  });

  test("returns a fresh typed cache", () => {
    const grouped = groupLineupsByMap([makeLineup()]);
    expect(
      parseLineupCache(JSON.stringify(grouped), "1000", 501, 1500)
    ).toEqual({ lineups: grouped, shouldRefresh: false });
  });

  test.each(["01", "1.0", "", "-1", "__proto__"])(
    "refreshes a cache with a noncanonical map key: %s",
    (mapKey) => {
      expect(
        parseLineupCache(
          JSON.stringify({ [mapKey]: [] }),
          "100",
          1000,
          500
        ).shouldRefresh
      ).toBe(true);
    }
  );

  test("does not display a cached record on the wrong map", () => {
    expect(
      parseLineupCache(
        JSON.stringify({ 2: [makeLineup({ mapId: 1 })] }),
        "100",
        1000,
        500
      )
    ).toEqual({ lineups: null, shouldRefresh: true });
  });

  test("parses hidden IDs defensively", () => {
    expect(parseHiddenMarkerIds('["one",2,"two"]')).toEqual([
      "one",
      "two",
    ]);
    expect(parseHiddenMarkerIds("{")).toEqual([]);
    expect(parseHiddenMarkerIds(null)).toEqual([]);
  });
});

describe("filterLineups", () => {
  const lineups = [
    makeLineup({ id: "a", ability: 1, tags: [1, 5], x: 30 }),
    makeLineup({ id: "b", ability: 2, tags: [1, 5, 9], x: 10 }),
    makeLineup({ id: "c", ability: 1, tags: [1], x: 20 }),
    makeLineup({ id: "d", agent: 14, ability: 1, tags: [1, 5], x: 0 }),
    makeLineup({ id: "hidden", ability: 1, tags: [1, 5], x: 40 }),
  ];

  test("supports all abilities, AND tags, hidden IDs, and x sorting", () => {
    const result = filterLineups(lineups, {
      agentId: 13,
      abilityId: null,
      tagIds: [1, 5],
      hiddenMarkerIds: ["hidden"],
    });
    expect(result.map((lineup) => lineup.id)).toEqual(["b", "a"]);
  });

  test("filters a selected ability exactly", () => {
    const result = filterLineups(lineups, {
      agentId: 13,
      abilityId: 1,
      tagIds: [],
      hiddenMarkerIds: [],
    });
    expect(result.map((lineup) => lineup.id)).toEqual([
      "c",
      "a",
      "hidden",
    ]);
  });

  test("does not mutate the source array", () => {
    const originalOrder = lineups.map((lineup) => lineup.id);
    filterLineups(lineups, {
      agentId: 13,
      abilityId: null,
      tagIds: [],
      hiddenMarkerIds: [],
    });
    expect(lineups.map((lineup) => lineup.id)).toEqual(originalOrder);
  });
});

describe("clusterLineups", () => {
  test("merges same-ability points inside the strict radius", () => {
    const clusters = clusterLineups([
      makeLineup({ id: "a", x: 0, y: 0, startX: 100 }),
      makeLineup({ id: "b", x: 10, y: 0, startX: 200 }),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].center).toEqual({ x: 5, y: 0 });
    expect(clusters[0].points.map((point) => point.id)).toEqual(["a", "b"]);
  });

  test("does not merge points exactly at the radius", () => {
    expect(
      clusterLineups([
        makeLineup({ id: "a", x: 0, y: 0 }),
        makeLineup({ id: "b", x: 15, y: 0 }),
      ])
    ).toHaveLength(2);
  });

  test("does not merge collocated markers for different abilities", () => {
    expect(
      clusterLineups([
        makeLineup({ id: "a", x: 0, y: 0, ability: 1 }),
        makeLineup({ id: "b", x: 0, y: 0, ability: 2 }),
      ])
    ).toHaveLength(2);
  });

  test("does not merge the same ability ID from different agents", () => {
    expect(
      clusterLineups([
        makeLineup({ id: "sova", x: 0, y: 0, agent: 13, ability: 1 }),
        makeLineup({ id: "viper", x: 0, y: 0, agent: 14, ability: 1 }),
      ])
    ).toHaveLength(2);
  });

  test("finds nearby markers in unsorted input without mutating it", () => {
    const lineups = [
      makeLineup({ id: "a", x: 0, y: 0 }),
      makeLineup({ id: "far", x: 100, y: 0 }),
      makeLineup({ id: "b", x: 10, y: 0 }),
    ];

    const clusters = clusterLineups(lineups);

    expect(clusters).toHaveLength(2);
    expect(clusters[0].points.map((point) => point.id)).toEqual(["a", "b"]);
    expect(lineups.map((lineup) => lineup.id)).toEqual(["a", "far", "b"]);
  });

  test("preserves the existing order-dependent pairwise center", () => {
    const clusters = clusterLineups([
      makeLineup({ id: "a", x: 0, y: 0 }),
      makeLineup({ id: "b", x: 8, y: 0 }),
      makeLineup({ id: "c", x: 12, y: 0 }),
    ]);
    expect(clusters[0].center.x).toBe(8);
  });

  test("centers one arrow for every cluster point", () => {
    const [cluster] = clusterLineups([
      makeLineup({ id: "a", x: 0, y: 10, startX: 20, startY: 30 }),
      makeLineup({ id: "b", x: 10, y: 10, startX: 40, startY: 50 }),
    ]);
    expect(arrowsForCluster(cluster)).toEqual([
      { x: 18, y: 23, startX: 33, startY: 43 },
      { x: 18, y: 23, startX: 53, startY: 63 },
    ]);
  });
});

describe("lineup loading", () => {
  test("uses a fresh cache without fetching", async () => {
    const storage = new MemoryStorage();
    const grouped = groupLineupsByMap([makeLineup()]);
    storage.setItem("savedLineups", JSON.stringify(grouped));
    storage.setItem("lastRetrievedTime", "1000");
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;

    const loaded = await loadLineups({
      storage,
      expirationMs: 1000,
      now: 1500,
      fetcher,
    });

    expect(loaded).toEqual({
      all: [makeLineup()],
      byMap: grouped,
      source: "cache",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("fetches, validates, groups, and writes an expired cache", async () => {
    const storage = new MemoryStorage();
    const lineups = [makeLineup(), makeLineup({ id: "two", mapId: 2 })];
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(responseWith(lineups));

    const loaded = await loadLineups({
      storage,
      expirationMs: localStorageExpirationTime,
      now: 1234,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    expect(loaded.source).toBe("network");
    expect(loaded.byMap).toEqual(groupLineupsByMap(lineups));
    expect(storage.getItem("savedLineups")).toBe(
      JSON.stringify(groupLineupsByMap(lineups))
    );
    expect(storage.getItem("lastRetrievedTime")).toBe("1234");
  });

  test("rejects non-2xx and malformed API responses", async () => {
    const failing = jest.fn() as jest.MockedFunction<typeof fetch>;
    failing.mockResolvedValue(responseWith({}, { ok: false, status: 503 }));
    await expect(fetchLineups(API_URL, failing)).rejects.toThrow(
      "status 503"
    );

    const malformed = jest.fn() as jest.MockedFunction<typeof fetch>;
    malformed.mockResolvedValue(responseWith([{ id: "incomplete" }]));
    await expect(fetchLineups(API_URL, malformed)).rejects.toThrow(
      "expected schema"
    );
  });

  test("loads from the API when the browser cannot read storage", async () => {
    const storage = new MemoryStorage();
    jest.spyOn(storage, "getItem").mockImplementation(() => {
      throw new Error("Storage access denied");
    });
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue(responseWith([makeLineup()]));

    await expect(
      loadLineups({ storage, expirationMs: 1000, now: 1500, fetcher })
    ).resolves.toMatchObject({ all: [makeLineup()], source: "network" });
  });

  test("returns fetched records when cache writes exceed the quota", async () => {
    const storage = new MemoryStorage();
    storage.setItem("savedLineups", JSON.stringify({ 1: [makeLineup()] }));
    storage.setItem("lastRetrievedTime", "100");
    jest.spyOn(storage, "setItem").mockImplementation((key) => {
      if (key === "savedLineups") throw new Error("Quota exceeded");
    });
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    const updated = makeLineup({ name: "Updated lineup" });
    fetcher.mockResolvedValue(responseWith([updated]));

    await expect(
      loadLineups({ storage, expirationMs: 1000, now: 1500, fetcher })
    ).resolves.toMatchObject({ all: [updated], source: "network" });
    expect(storage.setItem).not.toHaveBeenCalledWith("lastRetrievedTime", "1500");
    expect(storage.getItem("lastRetrievedTime")).toBe("100");
  });
});

describe("optional browser storage", () => {
  test("handles browsers that deny the localStorage getter", () => {
    const getter = jest.spyOn(window, "localStorage", "get");
    getter.mockImplementation(() => {
      throw new Error("Storage access denied");
    });
    try {
      expect(getBrowserStorage()).toBeUndefined();
      expect(readStorageItem("savedLineups")).toBeNull();
      expect(writeStorageItem("savedLineups", "{}")).toBe(false);
      expect(removeStorageItem("savedLineups")).toBe(false);
    } finally {
      getter.mockRestore();
    }
  });

  test("invalidates only the lineup cache after a mutation", () => {
    const storage = new MemoryStorage();
    storage.setItem("savedLineups", "{}");
    storage.setItem("lastRetrievedTime", "100");
    storage.setItem("hiddenMarkers", '["hidden"]');
    storage.setItem("editMarker", "record");

    invalidateLineupCache(storage);

    expect(storage.getItem("savedLineups")).toBeNull();
    expect(storage.getItem("lastRetrievedTime")).toBeNull();
    expect(storage.getItem("hiddenMarkers")).toBe('["hidden"]');
    expect(storage.getItem("editMarker")).toBe("record");
  });

  test("still removes cached data when timestamp removal fails", () => {
    const storage = new MemoryStorage();
    storage.setItem("savedLineups", "{}");
    const removeItem = storage.removeItem.bind(storage);
    jest.spyOn(storage, "removeItem").mockImplementation((key) => {
      if (key === "lastRetrievedTime") throw new Error("Removal denied");
      removeItem(key);
    });

    expect(() => invalidateLineupCache(storage)).not.toThrow();
    expect(storage.getItem("savedLineups")).toBeNull();
  });
});
