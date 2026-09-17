import { fireEvent, render, screen } from "@testing-library/react";

import { ABILITY_LIST, AGENT_LIST } from "../constants";
import Map from "./Map";
import Marker, { getMarkerIcon } from "./Marker";
import StartMarker from "./StartMarker";
import xIcon from "../../resources/x-icon.png";

describe("map presentation components", () => {
  it("renders a rotated map and forwards image events", () => {
    const onMapClick = jest.fn();
    const updateMap = jest.fn();

    render(
      <Map
        map={{ value: 1, label: "Ascent", icon: "ascent.png" }}
        rotation={90}
        onMapClick={onMapClick}
        updateMap={updateMap}
      />
    );

    const map = screen.getByRole("img", { name: "Ascent map" });
    expect(map).toHaveAttribute("src", "ascent.png");
    expect(map).toHaveStyle({ transform: "rotate(90deg)" });

    fireEvent.click(map);
    fireEvent.load(map);

    expect(onMapClick).toHaveBeenCalledTimes(1);
    expect(updateMap).toHaveBeenCalledTimes(1);
  });

  it("renders the matching ability icon and counter-scales a marker", () => {
    const agent = AGENT_LIST.find(({ value }) => value === 13);
    const ability = ABILITY_LIST[13]![0];

    render(
      <Marker
        id="lineup-1"
        lineup={{ agent, ability, x: 125, y: 250 }}
        rotation={90}
        scale={2}
      />
    );

    expect(screen.getByRole("img", { name: "ability marker" })).toHaveStyle({
      left: "125px",
      top: "250px",
      transform: "rotate(-90deg) scale(0.5)",
    });
    expect(getMarkerIcon(agent, ability)).toBe(ability.icon);
  });

  it("uses the fallback icon when marker selections are missing or invalid", () => {
    expect(getMarkerIcon(null, null)).toBe(xIcon);
    expect(
      getMarkerIcon(
        { value: -1, label: "Unknown" },
        { value: -1, label: "Unknown", icon: "unknown.png" }
      )
    ).toBe(xIcon);
  });

  it("uses the fallback icon for a registered ability without an icon asset", () => {
    const agent = AGENT_LIST.find(({ value }) => value === 13)!;
    const iconlessAbility = { value: 999, label: "Iconless test ability" };
    ABILITY_LIST[agent.value]!.push(iconlessAbility);

    try {
      expect(getMarkerIcon(agent, iconlessAbility)).toBe(xIcon);
    } finally {
      ABILITY_LIST[agent.value]!.pop();
    }
  });

  it("renders start coordinates and forwards start-marker clicks", () => {
    const onClick = jest.fn();
    render(<StartMarker x={12} y={34} onClick={onClick} />);

    const marker = screen.getByRole("img", { name: "ability marker" });
    expect(marker).toHaveStyle({ left: "12px", top: "34px" });
    fireEvent.click(marker);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
