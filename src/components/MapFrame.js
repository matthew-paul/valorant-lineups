import MapInteractionCSS from './MapInteractionCSS'
import Marker from './Marker'
import Map from './Map'
import React from 'react'
import lineups from './sampleLineup.json'

const MapFrame = ({ mapName, onMarkerClick }) => {

    return (
        <div className='map-frame'>
            <MapInteractionCSS>
                <Map mapName={mapName} />

                <div className='marker-frame'>
                    {lineups.map((lineup) => <Marker key={lineup.id} lineup={lineup} onClick={() => onMarkerClick(lineup.id)}/>)}
                </div>
            </MapInteractionCSS>
        </div>
    )
}

export default MapFrame
