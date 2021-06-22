import React from 'react'
import ImageFrame from './ImageFrame'
import YoutubeEmbed from "./YoutubeEmbed"
import PropTypes from 'prop-types'


const ContentFrame = (props) => {

    return (
        <div id='content-frame' className='content-frame' >
            {props.name !== '' ? <h1 className='content-frame-title'>{props.name}</h1> :
                <h1 className='content-frame-title'>Click a lineup icon to view info</h1>
            }
            {props.description !== '' && <h2 className='content-frame-description'>{props.description}</h2>}
            {props.credits !== '' && <h4 className='content-frame-description'>Credits: {props.credits}</h4>}
            {props.video !== '' &&
                <div className='video-frame'>
                    <YoutubeEmbed embedId={props.video} />
                </div>
            }
            {props.images.map((image, index) =>
                <ImageFrame key={index} image={image}/>
            )}
        </div>
    )
}

ContentFrame.propTypes = {
    name: PropTypes.string,
    images: PropTypes.array,
    video: PropTypes.string
}

ContentFrame.defaultProps = {
    name: '',
    images: [],
    video: ''
}

export default ContentFrame
