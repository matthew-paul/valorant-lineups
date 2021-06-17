import React from 'react'
import AscentMap from '../resources/Maps/ascent_map.png'
import { MAP_LIST } from './constants'

const Map = ({ mapId }) => {

    const onClick = (e) => {
        console.log(e.nativeEvent.offsetX-15, e.nativeEvent.offsetY-15)
    }

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
            alt={(mapId in MAP_LIST ? MAP_LIST[mapId] : 'unrecognized') + ' map'}
            src={getMap(mapId)}
            onClick={onClick}
        />
        
    )
}

export default Map
