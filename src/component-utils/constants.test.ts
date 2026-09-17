import {
  ABILITY_LIST,
  AGENT_LIST,
  MAP_LIST,
  getAbilityFromId,
  getAgentFromId,
  getImagesFromIds,
  getMapFromId,
  getTagsFromIds,
} from "./constants";

describe("lineup constants lookups", () => {
  it("resolves known agent, ability, and map IDs", () => {
    expect(getAgentFromId(13)).toMatchObject({
      value: 13,
      label: "Sova",
    });
    expect(getAbilityFromId(13, 1)).toMatchObject({
      value: 1,
      label: "Recon Bolt",
    });
    expect(getMapFromId(1)).toMatchObject({
      value: 1,
      label: "Ascent",
    });
    expect(getMapFromId(12)).toMatchObject({
      value: 12,
      label: "Summit",
    });
  });

  it("returns undefined instead of throwing for unknown IDs", () => {
    expect(getAgentFromId(-1)).toBeUndefined();
    expect(getAbilityFromId(-1, 1)).toBeUndefined();
    expect(getAbilityFromId(13, -1)).toBeUndefined();
    expect(getMapFromId(-1)).toBeUndefined();
  });

  it("filters unknown tag IDs and converts image URLs to image tags", () => {
    expect(getTagsFromIds([10, 1, -1])).toEqual([
      { value: 1, label: "Attacking" },
      { value: 10, label: "Medium" },
    ]);
    expect(getImagesFromIds(["one.png", "two.png"])).toEqual([
      { id: "one.png", text: "one.png" },
      { id: "two.png", text: "two.png" },
    ]);
  });

  it("keeps the map catalog unique, alphabetical, and fully illustrated", () => {
    const mapIds = MAP_LIST.map((map) => map.value);
    const mapLabels = MAP_LIST.map((map) => map.label);

    expect(new Set(mapIds).size).toBe(MAP_LIST.length);
    expect(new Set(mapLabels).size).toBe(MAP_LIST.length);
    expect(mapLabels).toEqual(
      [...mapLabels].sort((left, right) => left.localeCompare(right))
    );
    MAP_LIST.forEach((map) => {
      expect(map.icon).toEqual(expect.any(String));
      expect(map.icon).not.toHaveLength(0);
    });
  });

  it("keeps enabled agents and their selected ability catalogs consistent", () => {
    const agentIds = AGENT_LIST.map((agent) => agent.value);
    const agentLabels = AGENT_LIST.map((agent) => agent.label);

    expect(new Set(agentIds).size).toBe(AGENT_LIST.length);
    expect(new Set(agentLabels).size).toBe(AGENT_LIST.length);

    AGENT_LIST.forEach((agent) => {
      const abilities = ABILITY_LIST[agent.value];
      expect(abilities).toBeDefined();
      expect(abilities).not.toHaveLength(0);

      const abilityIds = abilities!.map((ability) => ability.value);
      const abilityLabels = abilities!.map((ability) => ability.label);
      expect(new Set(abilityIds).size).toBe(abilities!.length);
      expect(new Set(abilityLabels).size).toBe(abilities!.length);

      const emptyIcons = abilities!.filter(
        (ability) => ability.icon !== undefined && ability.icon.length === 0
      );
      expect(emptyIcons).toEqual([]);
    });
  });
});
