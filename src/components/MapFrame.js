import MapInteractionCSS from './MapInteractionCSS'
import Marker from './Marker'
import Map from './Map'
import React from 'react'

const MapFrame = ({ mapName, onMarkerClick }) => {
    return (
        <div className='map-frame'>
            <MapInteractionCSS>
                <Map mapName={mapName} />

                <div className='marker-frame'>
                <Marker
                    id={1}
                    agent='Sova'
                    icon='Recon Bolt'
                    x={24.8}
                    y={7.5}
                    startX={55.1}
                    startY={28.1}
                    onClick={() => onMarkerClick(1)}
                    />
                </div>
            </MapInteractionCSS>
        </div>
    )
}

export default MapFrame
