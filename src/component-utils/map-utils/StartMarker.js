import React from "react";
import startIcon from "../../resources/start-icon.png";
import PropTypes from "prop-types";

const StartMarker = (props) => {
  return (
    <img
      id={props.id}
      className="marker-icon"
      src={startIcon}
      alt="ability marker"
      style={{
        transform: `rotate(${-props.rotation}deg) scale(${Math.min(
          1,
          1 / props.scale
        )})`,
        // counter rotate to keep icon facing same direction, scale icons automatically with map zoom, keeping max scale at 1
        left: `${props.x}px`,
        top: `${props.y}px`,
      }}
      onClick={props.onClick}
    />
  );
};

StartMarker.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  rotation: PropTypes.number,
  onClick: PropTypes.func,
  scale: PropTypes.number,
  id: PropTypes.string,
};

StartMarker.defaultProps = {
  id: "",
  rotation: 0,
  onClick: null,
  scale: 1,
};

export default StartMarker;
