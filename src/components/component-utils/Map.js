import React, { Component } from 'react'
import AscentMap from '../../resources/Maps/ascent_map.png'
import { MAP_LIST } from './constants'
import PropTypes from 'prop-types'

export class Map extends Component {

    getMap = (mapId) => {

        if (!(mapId in MAP_LIST)) {
            console.warn('map id not recognized:', mapId);
            return null;
        }

        let mapName = MAP_LIST[mapId]

        switch (mapName) {
            case 'Ascent':
                return AscentMap
            default:
                console.error('Map not recognized:', mapName)
                return null
        }
    }

    render() {
        return (
            <img
                className='map-icon'
                alt={(this.props.mapId in MAP_LIST ? MAP_LIST[this.props.mapId] : 'unrecognized') + ' map'}
                src={this.getMap(this.props.mapId)}
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
    onMouseDown: null
}

export default Map
