import React, { Component } from "react";
import type { MapOption } from "../../types/lineup";

export interface MapProps {
  map: MapOption;
  rotation?: number;
  updateMap?: React.ReactEventHandler<HTMLImageElement>;
  onMapClick?: React.MouseEventHandler<HTMLImageElement>;
  onMouseDown?: React.MouseEventHandler<HTMLImageElement>;
}

export class Map extends Component<MapProps> {
  render(): JSX.Element {
    const {
      map,
      rotation = 0,
      updateMap,
      onMapClick,
      onMouseDown,
    } = this.props;

    return (
      <img
        style={{ transform: `rotate(${rotation}deg)` }}
        alt={`${map.label} map`}
        src={map.icon}
        onClick={onMapClick}
        onMouseDown={onMouseDown}
        onLoad={updateMap} // Add markers after the image loads so they use its rendered dimensions.
      />
    );
  }
}

export default Map;
