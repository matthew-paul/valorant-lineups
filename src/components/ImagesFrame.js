import React from 'react'
import PinchZoomPan from 'react-responsive-pinch-zoom-pan'
import YoutubeEmbed from "./YoutubeEmbed"
import ScrollLock from 'react-scrolllock'

const ImagesFrame = ({ image }) => {
    return (
        <ScrollLock>
            <div className='content-frame'>
                <div className='image-frame'>
                    <PinchZoomPan doubleTapBehavior='zoom' position='center' initialScale={1} minScale={1} maxScale={4} zoomButtons={false}>
                        <img className='image-1' src={image} alt='' />
                    </PinchZoomPan>
                </div>
                <div className='video-frame'>
                    <YoutubeEmbed embedId="7A0_-C4HSFw" />
                </div>
            </div>
        </ScrollLock>
    )
}

export default ImagesFrame
