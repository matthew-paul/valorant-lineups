import type { LineupRecord } from "../types/lineup";

export const makeLineup = (
  overrides: Partial<LineupRecord> = {}
): LineupRecord => ({
  id: "lineup-1",
  name: "Test lineup",
  description: "Test description",
  agent: 13,
  ability: 1,
  mapId: 1,
  tags: [1, 5],
  images: ["https://example.com/image.jpg"],
  video: "abcdefghijk",
  credits: "https://example.com",
  x: 100,
  y: 200,
  startX: 300,
  startY: 400,
  ...overrides,
});
