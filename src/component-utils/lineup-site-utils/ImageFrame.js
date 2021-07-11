import React from 'react'
import PinchZoomPan from '../responsive-pinch-zoom-pan/PinchZoomPan'
import disableScroll from 'disable-scroll'


export const ImageFrame = (props) => {

    const handleEnter = () => disableScroll['on'](document.getElementById('content-frame'))
    const handleLeave = () => disableScroll['off']()

    return (
        <div className='image-frame' >
            <PinchZoomPan doubleTapBehavior='zoom' position='center' initialScale={1} minScale={1} maxScale={10} zoomButtons={false}>
                <img
                    className='lineup-image'
                    src={props.image} alt='lineup info'
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave} />
            </PinchZoomPan>
        </div>
    )
}

export default ImageFrame
