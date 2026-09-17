import React from "react";
import startIcon from "../../resources/start-icon.png";

export interface StartMarkerProps {
  x: number;
  y: number;
  rotation?: number;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  scale?: number;
  id?: string;
}

const StartMarker = ({
  x,
  y,
  rotation = 0,
  onClick,
  scale = 1,
  id = "",
}: StartMarkerProps): JSX.Element => {
  return (
    <img
      id={id}
      className="marker-icon"
      src={startIcon}
      alt="ability marker"
      style={{
        transform: `rotate(${-rotation}deg) scale(${Math.min(1, 1 / scale)})`,
        // counter rotate to keep icon facing same direction, scale icons automatically with map zoom, keeping max scale at 1
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={onClick}
    />
  );
};

export default StartMarker;
