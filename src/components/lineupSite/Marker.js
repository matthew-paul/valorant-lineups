import React from 'react'
import ReconBolt from '../../resources/Agents/Sova/Recon_Bolt.png'
import xIcon from '../../resources/x-icon.png'

import { AGENT_LIST, ABILITY_LIST } from '../component-utils/constants'

const Marker = (props) => {

    const getIcon = (agentId, abilityId) => {


        if (!(agentId in AGENT_LIST)) {
            return xIcon;
        }

        let agentName = AGENT_LIST[agentId]

        if (ABILITY_LIST[agentId] === undefined || !(abilityId in ABILITY_LIST[agentId])) {
            return xIcon;
        }

        let abilityName = ABILITY_LIST[agentId][abilityId]


        switch (agentName) {
            case 'Sova':
                switch (abilityName) {
                    case 'Recon Bolt':
                        return ReconBolt
                    default:
                        return xIcon;
                }
            default:
                return xIcon;
        }
    }


    return (
        <img
            className='marker-icon'
            src={getIcon(props.lineup.agent, props.lineup.ability)}
            alt='recon bolt'
            style={{ left: `${props.lineup.x}%`, top: `${props.lineup.y}%` }}
            onClick={'onClick' in props ? props.onClick : null}
        />
    )
}

export default Marker
