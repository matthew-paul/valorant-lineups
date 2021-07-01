import React from 'react'
import xIcon from '../../resources/x-icon.png'
import PropTypes from 'prop-types'

import { AGENT_LIST, ABILITY_LIST } from '../constants'

const Marker = (props) => {

    const getIcon = (agentId, abilityId) => {

        try {
            for (const agent of AGENT_LIST) {
                if (agentId === agent.value) {
                    for (const ability of ABILITY_LIST[agentId]) {
                        if (abilityId === ability.value) {
                            return ability.icon
                        }
                    }
                    break;
                }
            }

            return xIcon
        } catch (err) {
            console.log(`error getting icon for agent ${agentId} ability ${abilityId}`)
            return xIcon
        }
    }


    return (
        <img
            id={props.id}
            className='marker-icon'
            src={getIcon(props.lineup.agent, props.lineup.ability)}
            alt='recon bolt'
            style={{
                transform: `scale(${1/props.scale})`,
                left: `${props.lineup.x}px`,
                top: `${props.lineup.y}px`
            }}
            onClick={props.onClick}
            onMouseOver={props.onHover}
            onMouseOut={props.onLeave}
        />

    )
}

Marker.propTypes = {
    lineup: PropTypes.object,
    onClick: PropTypes.func,
    onHover: PropTypes.func,
    onLeave: PropTypes.func,
    scale: PropTypes.number,
    id: PropTypes.string
}

Marker.defaultProps = {
    id: '',
    onClick: null,
    onHover: null,
    onLeave: null,
    scale: 1,
}


export default Marker
