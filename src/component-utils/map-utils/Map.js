import React, { Component } from 'react'
import AscentMap from '../../resources/Maps/ascent_map.png'
import BindMap from '../../resources/Maps/bind_map.png'
import { MAP_LIST } from '../constants'
import PropTypes from 'prop-types'

export class Map extends Component {

    getMap = (mapId) => {

        let mapName = '';

        for (const map of MAP_LIST) {
            if (mapId === map.value) {
                mapName = map.label
                break;
            }
        }

        switch (mapName) {
            case 'Ascent':
                return AscentMap
            case 'Bind':
                return BindMap
            default:
                console.error('map not recognized:', mapName)
                return null
        }
    }

    render() {
        return (
            <img
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
