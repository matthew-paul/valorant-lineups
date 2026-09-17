import React from "react";
import xIcon from "../../resources/x-icon.png";

import { AGENT_LIST, ABILITY_LIST } from "../constants";
import type { AbilityOption, AgentOption } from "../../types/lineup";

export interface MarkerLineup {
  agent: AgentOption | null | undefined;
  ability: AbilityOption | null | undefined;
  x: number;
  y: number;
}

export interface MarkerProps {
  lineup: MarkerLineup;
  rotation?: number;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  onHover?: React.MouseEventHandler<HTMLImageElement>;
  onLeave?: React.MouseEventHandler<HTMLImageElement>;
  scale?: number;
  id?: string;
}

export const getMarkerIcon = (
  lineupAgent: AgentOption | null | undefined,
  lineupAbility: AbilityOption | null | undefined
): string => {
  if (lineupAgent == null || lineupAbility == null) {
    return xIcon;
  }

  const isKnownAgent = AGENT_LIST.some(
    (agent) => agent.value === lineupAgent.value
  );
  if (!isKnownAgent) {
    return xIcon;
  }

  return (
    ABILITY_LIST[lineupAgent.value]?.find(
      (ability) => ability.value === lineupAbility.value
    )?.icon ?? xIcon
  );
};

const Marker = ({
  lineup,
  rotation = 0,
  onClick,
  onHover,
  onLeave,
  scale = 1,
  id = "",
}: MarkerProps): JSX.Element => {
  return (
    <img
      id={id}
      className="marker-icon"
      src={getMarkerIcon(lineup.agent, lineup.ability)}
      alt="ability marker"
      style={{
        transform: `rotate(${-rotation}deg) scale(${Math.min(1, 1 / scale)})`,
        // counter rotate to keep icon facing same direction, scale icons automatically with map zoom, keeping max scale at 1
        left: `${lineup.x}px`,
        top: `${lineup.y}px`,
      }}
      onClick={onClick}
      onMouseOver={onHover}
      onMouseOut={onLeave}
    />
  );
};

export default Marker;
