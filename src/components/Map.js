import AscentMap from '../resources/Maps/ascent_map.png'

const Map = ({ mapName }) => {

    const onClick = (e) => {
        console.log(e.nativeEvent.offsetX-15, e.nativeEvent.offsetY-15)
    }

    const getMap = (mapName) => {
        switch(mapName) {
            case 'ascent':
                return AscentMap
            default:
                console.error('Map not recognized:', mapName)
                return null
        }
    }
    
    return (
        <img
            className='map-icon'
            alt={mapName + ' map'}
            src={getMap(mapName)}
            onClick={onClick}
        />
        
    )
}

export default Map
