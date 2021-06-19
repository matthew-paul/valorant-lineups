import MapInteractionCSS from '../component-utils/MapInteractionCSS'
import Marker from './Marker'
import Map from '../component-utils/Map'
import React from 'react'
import lineups from './sampleLineup.json'

const MapFrame = ({ mapId, onMarkerClick }) => {

    const onMapClick = (e) => {
        console.log(e.nativeEvent.offsetX - 12.5, e.nativeEvent.offsetY - 12.5)
    }

    return (
        <div className='map-frame'>
            <MapInteractionCSS>
                <Map mapId={mapId} onMapClick={onMapClick} />

                <div className='marker-frame'>
                    {lineups.map((lineup) => <Marker key={lineup.id} lineup={lineup} onClick={() => onMarkerClick(lineup.id)} />)}
                </div>
            </MapInteractionCSS>
        </div>
    )
}

export default MapFrame
