import React from 'react'
import AscentMap from '../../resources/Maps/ascent_map.png'
import { MAP_LIST } from './constants'
import PropTypes from 'prop-types'

const Map = (props) => {

    const getMap = (mapId) => {

        if(!(mapId in MAP_LIST)) {
            console.warn('map id not recognized:', mapId);
            return null;
        }

        let mapName = MAP_LIST[mapId]

        switch(mapName) {
            case 'Ascent':
                return AscentMap
            default:
                console.error('Map not recognized:', mapName)
                return null
        }
    }
    
    return (
        <img
            className='map-icon'
            alt={(props.mapId in MAP_LIST ? MAP_LIST[props.mapId] : 'unrecognized') + ' map'}
            src={getMap(props.mapId)}
            onClick={props.onMapClick != null ? props.onMapClick : null}
        />
        
    )
}

Map.propTypes = {
    mapId: PropTypes.number.isRequired,
    onMapClick: PropTypes.func
}

export default Map
