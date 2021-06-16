import ReconBolt from '../resources/Agents/Sova/Recon_Bolt.png'

const Marker = (props) => {
    const getIcon = (agent, icon) => {
        switch(agent) {
            case 'Sova':
                switch(icon) {
                    case 'Recon Bolt':
                        return ReconBolt
                    default:
                        console.log(agent, 'icon:', icon, 'not recognized')
                        return null;
                }
            default:
                console.log('agent not recognized:', agent)
                return null;
        }
    }


    return (
        <img
          className='marker-icon'
          src={getIcon(props.agent, props.icon)}
          alt='recon bolt'
          style={{ left: `${props.x}%`, top: `${props.y}%`}}
          onClick={props.onClick}
        />
    )
}

export default Marker
