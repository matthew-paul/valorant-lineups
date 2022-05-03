import React, { Component } from "react";
import PropTypes from "prop-types";

export class Map extends Component {
  render() {
    return (
      <img
        style={{ transform: `rotate(${this.props.rotation}deg)` }}
        alt={this.props.map.label + " map"}
        src={this.props.map.icon}
        onClick={this.props.onMapClick != null ? this.props.onMapClick : null}
        onMouseDown={this.props.onMouseDown}
        onLoad={this.props.updateMap} // add lineup markers after image has been loaded, otherwise markers will overlap on original image/look wierd
      />
    );
  }
}

Map.propTypes = {
  map: PropTypes.object.isRequired,
  rotation: PropTypes.number,
  updateMap: PropTypes.func,
  onMapClick: PropTypes.func,
  onMouseDown: PropTypes.func,
};

Map.defaultProps = {
  rotation: 0,
  updateMap: null,
  onMapClick: null,
  onMouseDown: null,
};

export default Map;
