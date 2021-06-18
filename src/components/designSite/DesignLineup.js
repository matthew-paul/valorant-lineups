import React from 'react'
//import { AGENT_LIST, ABILITY_LIST, MAP_LIST, TAG_LIST } from './constants'

import Form from './Form.js'
import MapInteractionCSS from '../component-utils/MapInteractionCSS.js'
import Map from '../component-utils/Map.js'

const DesignLineup = () => {

    const onMapClick = (e) => {
        console.log((e.nativeEvent.offsetX - 15) / 10.0, (e.nativeEvent.offsetY - 15) / 10.0)
    }

    return (
        <div className='design-outer-frame'>
            <h1 className='design-site-header' >LINEUP DESIGN</h1>
            <div className='design-form-frame'>
                <div className='design-map-frame'>
                    <MapInteractionCSS>
                        <Map mapId={1} onMapClick={onMapClick} />

                    </MapInteractionCSS>
                </div>
                <Form />
            </div>
        </div>
    )
}

export default DesignLineup
