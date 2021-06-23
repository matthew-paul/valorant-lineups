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
                alt={this.getMap(this.props.mapId).label + ' map'}
                src={this.getMap(this.props.mapId).icon}
                onClick={this.props.onMapClick != null ? this.props.onMapClick : null}
                onMouseDown={this.props.onMouseDown}
            />
        )
    }
}

Map.propTypes = {
    mapId: PropTypes.number.isRequired,
    onMapClick: PropTypes.func,
    onMouseDown: PropTypes.func
}

Map.defaultProps = {
    onMapClick: null,
    onMouseDown: null,
}

export default Map
