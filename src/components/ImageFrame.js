import React, { Component } from 'react'
import PinchZoomPan from 'react-responsive-pinch-zoom-pan'

export class ImageFrame extends Component {
    render() {
        return (
            <div className='image-frame' onWheel={() => { console.log('wheel') }}>
                <PinchZoomPan doubleTapBehavior='zoom' position='center' initialScale={1} minScale={1} maxScale={4} zoomButtons={false}>
                    <img className='image-1' src={this.props.image} alt='' />
                </PinchZoomPan>
            </div>
        )
    }
}

export default ImageFrame
