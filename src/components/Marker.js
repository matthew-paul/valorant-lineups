import React from 'react'
import ReconBolt from '../resources/Agents/Sova/Recon_Bolt.png'

const Marker = ({ lineup, onClick }) => {
    const getIcon = (agent, ability) => {
        switch(agent) {
            case 'Sova':
                switch(ability) {
                    case 'Recon Bolt':
                        return ReconBolt
                    default:
                        console.log(agent, 'icon:', ability, 'not recognized')
                        return null;
                }
            default:
                console.log('agent not recognized:', agent)
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
