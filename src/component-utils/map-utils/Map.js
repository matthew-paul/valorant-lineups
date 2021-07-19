import React, { Component } from 'react'
import { MAP_LIST } from '../constants'
import PropTypes from 'prop-types'

export class Map extends Component {

    
    getMap = (mapId) => {
        for (const map of MAP_LIST) {
            if (mapId === map.value) {
                return { icon: map.icon, label: map.label }
            }
        }

        console.error('map not recognized:', mapId)
        return null;
    }

    render() {
        
        return (
            <img
                style={{ transform: `rotate(${this.props.rotation}deg)`}}
                alt={this.getMap(this.props.mapId).label + ' map'}
                src={this.getMap(this.props.mapId).icon}
                onClick={this.props.onMapClick != null ? this.props.onMapClick : null}
                onMouseDown={this.props.onMouseDown}
                onLoad={this.props.updateMap} // add lineup markers after image has been loaded, otherwise markers will overlap on original image/look wierd
            />
        )
    }
}

Map.propTypes = {
    mapId: PropTypes.number.isRequired,
    rotation: PropTypes.number,
    updateMap: PropTypes.func,
    onMapClick: PropTypes.func,
    onMouseDown: PropTypes.func
}

Map.defaultProps = {
    rotation: 0,
    updateMap: null,
    onMapClick: null,
    onMouseDown: null,
}

export default Map
