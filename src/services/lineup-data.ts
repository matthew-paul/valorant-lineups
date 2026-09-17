import { API_URL } from "../component-utils/constants";
import type {
  LineupCluster,
  LineupRecord,
  LineupsByMap,
  MapArrow,
  Point,
} from "../types/lineup";

export const CLUSTER_RADIUS = 15;
export const MARKER_CENTER_OFFSET = 13;

export interface LineupFilters {
  agentId: number;
  abilityId: number | null;
  tagIds: number[];
  hiddenMarkerIds: string[];
}

export interface ParsedLineupCache {
  lineups: LineupsByMap | null;
  shouldRefresh: boolean;
}

export interface LineupStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadLineupsOptions {
  storage?: LineupStorage;
  expirationMs: number;
  now?: number;
  fetcher?: typeof fetch;
  url?: string;
}

export interface LoadedLineups {
  all: LineupRecord[];
  byMap: LineupsByMap;
  source: "cache" | "network";
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

// Storage is an optional cache: browsers may deny access or exhaust its quota.
export const getBrowserStorage = (): LineupStorage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const readStorageItem = (
  key: string,
  storage = getBrowserStorage()
): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const writeStorageItem = (
  key: string,
  value: string,
  storage = getBrowserStorage()
): boolean => {
  try {
    if (storage === undefined) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const removeStorageItem = (
  key: string,
  storage = getBrowserStorage()
): boolean => {
  try {
    if (storage === undefined) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const invalidateLineupCache = (storage = getBrowserStorage()): void => {
  removeStorageItem("lastRetrievedTime", storage);
  removeStorageItem("savedLineups", storage);
};

export const isLineupRecord = (value: unknown): value is LineupRecord => {
  if (typeof value !== "object" || value === null) return false;

  const lineup = value as Partial<LineupRecord>;
  return (
    typeof lineup.id === "string" &&
    typeof lineup.name === "string" &&
    typeof lineup.description === "string" &&
    isNumber(lineup.agent) &&
    isNumber(lineup.ability) &&
    isNumber(lineup.mapId) &&
    Array.isArray(lineup.tags) &&
    lineup.tags.every(isNumber) &&
    Array.isArray(lineup.images) &&
    lineup.images.every((image) => typeof image === "string") &&
    typeof lineup.video === "string" &&
    typeof lineup.credits === "string" &&
    isNumber(lineup.x) &&
    isNumber(lineup.y) &&
    isNumber(lineup.startX) &&
    isNumber(lineup.startY)
  );
};

export const isLineupArray = (value: unknown): value is LineupRecord[] =>
  Array.isArray(value) && value.every(isLineupRecord);

export const groupLineupsByMap = (lineups: LineupRecord[]): LineupsByMap =>
  lineups.reduce<LineupsByMap>((grouped, lineup) => {
    (grouped[lineup.mapId] ??= []).push(lineup);
    return grouped;
  }, {});

export const flattenLineups = (grouped: LineupsByMap): LineupRecord[] =>
  Object.values(grouped).flatMap((lineups) => lineups ?? []);

export const findLineupById = (
  lineups: LineupRecord[],
  lineupId: string | undefined
): LineupRecord | undefined =>
  lineupId === undefined
    ? undefined
    : lineups.find((lineup) => lineup.id === lineupId);

export const parseLineupCache = (
  serializedLineups: string | null,
  serializedTimestamp: string | null,
  expirationMs: number,
  now = Date.now()
): ParsedLineupCache => {
  if (serializedLineups === null || serializedTimestamp === null) {
    return { lineups: null, shouldRefresh: true };
  }

  const timestamp = Number(serializedTimestamp);
  if (
    serializedTimestamp.trim() === "" ||
    !Number.isFinite(timestamp) ||
    timestamp < 0 ||
    timestamp > now ||
    !Number.isFinite(expirationMs) ||
    expirationMs <= 0 ||
    now - timestamp >= expirationMs
  ) {
    return { lineups: null, shouldRefresh: true };
  }

  try {
    const parsed: unknown = JSON.parse(serializedLineups);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { lineups: null, shouldRefresh: true };
    }

    const entries = Object.entries(parsed);
    const lineups: LineupsByMap = {};
    for (const [mapId, records] of entries) {
      const numericMapId = Number(mapId);
      if (
        !Number.isSafeInteger(numericMapId) ||
        numericMapId < 1 ||
        String(numericMapId) !== mapId ||
        !isLineupArray(records) ||
        records.some((record) => record.mapId !== numericMapId)
      ) {
        return { lineups: null, shouldRefresh: true };
      }
      lineups[numericMapId] = records;
    }

    return { lineups, shouldRefresh: false };
  } catch {
    return { lineups: null, shouldRefresh: true };
  }
};

export const parseHiddenMarkerIds = (serialized: string | null): string[] => {
  if (serialized === null) return [];
  try {
    const value: unknown = JSON.parse(serialized);
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

export const filterLineups = (
  lineups: LineupRecord[],
  filters: LineupFilters
): LineupRecord[] => {
  const hidden = new Set(filters.hiddenMarkerIds);
  return lineups
    .filter((lineup) => {
      if (lineup.agent !== filters.agentId) return false;
      if (
        filters.abilityId !== null &&
        lineup.ability !== filters.abilityId
      ) {
        return false;
      }
      if (hidden.has(lineup.id)) return false;
      return filters.tagIds.every((tagId) => lineup.tags.includes(tagId));
    })
    .sort((left, right) => left.x - right.x);
};

const getDistance = (point1: Point, point2: Point): number =>
  Math.hypot(point1.x - point2.x, point1.y - point2.y);

const getCenter = (point1: Point, point2: Point): Point => ({
  x: (point1.x + point2.x) / 2,
  y: (point1.y + point2.y) / 2,
});

export const clusterLineups = (
  lineups: LineupRecord[],
  radius = CLUSTER_RADIUS
): LineupCluster[] => {
  const clusters: LineupCluster[] = [...lineups]
    .sort((left, right) => left.x - right.x)
    .map((lineup) => ({
      center: { x: lineup.x, y: lineup.y },
      points: [
        { id: lineup.id, startX: lineup.startX, startY: lineup.startY },
      ],
      ability: lineup.ability,
      agent: lineup.agent,
    }));

  let index = 0;
  while (index < clusters.length - 1) {
    let neighborIndex = index + 1;
    while (
      neighborIndex < clusters.length &&
      clusters[neighborIndex].center.x - clusters[index].center.x < radius
    ) {
      if (
        clusters[neighborIndex].agent !== clusters[index].agent ||
        clusters[neighborIndex].ability !== clusters[index].ability
      ) {
        neighborIndex += 1;
        continue;
      }

      if (
        getDistance(clusters[index].center, clusters[neighborIndex].center) <
        radius
      ) {
        clusters[index].points.push(...clusters[neighborIndex].points);
        clusters[index].center = getCenter(
          clusters[index].center,
          clusters[neighborIndex].center
        );
        clusters.splice(neighborIndex, 1);
        continue;
      }

      neighborIndex += 1;
    }
    index += 1;
  }

  return clusters;
};

export const arrowsForCluster = (
  cluster: LineupCluster,
  offset = MARKER_CENTER_OFFSET
): MapArrow[] =>
  cluster.points.map((point) => ({
    x: cluster.center.x + offset,
    y: cluster.center.y + offset,
    startX: point.startX + offset,
    startY: point.startY + offset,
  }));

export const fetchLineups = async (
  url = API_URL,
  fetcher: typeof fetch = fetch
): Promise<LineupRecord[]> => {
  const response = await fetcher(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Lineup request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!isLineupArray(data)) {
    throw new Error("Lineup response did not match the expected schema");
  }
  return data;
};

export const loadLineups = async ({
  storage = getBrowserStorage(),
  expirationMs,
  now = Date.now(),
  fetcher = fetch,
  url = API_URL,
}: LoadLineupsOptions): Promise<LoadedLineups> => {
  const cached = parseLineupCache(
    readStorageItem("savedLineups", storage),
    readStorageItem("lastRetrievedTime", storage),
    expirationMs,
    now
  );

  if (!cached.shouldRefresh && cached.lineups !== null) {
    return {
      all: flattenLineups(cached.lineups),
      byMap: cached.lineups,
      source: "cache",
    };
  }

  const all = await fetchLineups(url, fetcher);
  const byMap = groupLineupsByMap(all);
  // Do not freshen an old dataset if writing the replacement fails.
  if (writeStorageItem("savedLineups", JSON.stringify(byMap), storage)) {
    writeStorageItem("lastRetrievedTime", String(now), storage);
  }
  return { all, byMap, source: "network" };
};
