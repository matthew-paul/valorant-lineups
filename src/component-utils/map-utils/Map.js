import React, { Component } from 'react'
import { MAP_LIST } from '../constants'
import PropTypes from 'prop-types'

export class Map extends Component {

    getMap = (mapId) => {

        let mapName = '';

        for (const map of MAP_LIST) {
            if (mapId === map.value) {
                return map.icon
            }
        }

        console.error('map not recognized:', mapName)
        return null;
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
