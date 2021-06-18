import React from 'react'
//import { AGENT_LIST, ABILITY_LIST, MAP_LIST, TAG_LIST } from './constants'

import Form from './Form.js'
import MapInteractionCSS from '../component-utils/MapInteractionCSS.js'
import Map from '../component-utils/Map.js'

const DesignLineup = () => {
    return (
        <div className='design-outer-frame'>
            <h1 className='design-site-header' >LINEUP DESIGN</h1>
            <div className='design-form'>
                <div className='design-map-frame'>
                    <MapInteractionCSS>
                        <Map mapId={1} />

                    </MapInteractionCSS>
                </div>
                <Form />
            </div>
        </div>
    )
}

export default DesignLineup
