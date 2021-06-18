import React from 'react'
import ReconBolt from '../../resources/Agents/Sova/Recon_Bolt.png'
import { AGENT_LIST, ABILITY_LIST } from '../component-utils/constants'

const Marker = ({ lineup, onClick }) => {

    const getIcon = (agentId, abilityId) => {


        if (!(agentId in AGENT_LIST)) {
            console.warn('agent ID not recognized:', agentId)
            return null;
        }

        let agentName = AGENT_LIST[agentId]

        if (!(abilityId in ABILITY_LIST[agentId])) {
            console.warn('ability ID not recognized:', abilityId)
            return null;
        }

        let abilityName = ABILITY_LIST[agentId][abilityId]

        
        switch(agentName) {
            case 'Sova':
                switch(abilityName) {
                    case 'Recon Bolt':
                        return ReconBolt
                    default:
                        console.warn(agentName, 'icon:', abilityName, 'not recognized')
                        return null;
                }
            default:
                console.warn('agent not recognized:', agentName)
                return null;
        }
    }

    console.log(lineup)

    return (
        <img
          className='marker-icon'
          src={getIcon(lineup.agent, lineup.ability)}
          alt='recon bolt'
          style={{ left: `${lineup.x}%`, top: `${lineup.y}%`}}
          onClick={onClick}
        />
    )
}

export default Marker
