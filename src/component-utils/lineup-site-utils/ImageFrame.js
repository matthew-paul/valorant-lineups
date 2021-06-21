import React from 'react'
import PinchZoomPan from '../responsive-pinch-zoom-pan/PinchZoomPan'



export const ImageFrame = (props) => {

    return (
        <div className='image-frame' >
            <PinchZoomPan doubleTapBehavior='zoom' position='center' initialScale={1} minScale={1} maxScale={6} zoomButtons={false}>
                <img className='lineup-image' src={props.image} alt='' onMouseEnter={props.enterImageFocus} onMouseLeave={props.exitImageFocus} />
            </PinchZoomPan>
        </div>
    )
}

export default ImageFrame
