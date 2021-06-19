import React from 'react'
import ImageFrame from './ImageFrame'
import YoutubeEmbed from "../component-utils/YoutubeEmbed"
import disableScroll from 'disable-scroll'
import PropTypes from 'prop-types'


const ContentFrame = (props) => {


    // disable page scrolling when hovering over image, so user can zoom in on photo without scrolling page
    function disableWindowScroll() {
        disableScroll['on'](document.getElementById('content-frame'));
    }

    function enableWindowScroll() {
        disableScroll['off']();
    }

    const enterImageFocus = () => {
        disableWindowScroll();
    }

    const exitImageFocus = () => {
        enableWindowScroll();
    }

    return (
        <div id='content-frame' className='content-frame' >
            {
                props.videoId !== '' ?
                    <div className='video-frame'>
                        <YoutubeEmbed embedId={props.videoId} />
                    </div>
                    : ''
            }
            {
                props.images.map((image) =>
                    <ImageFrame image={image} enterImagefocus={enterImageFocus} exitImageFocus={exitImageFocus} />
                )
            }
        </div>
    )
}

ContentFrame.propTypes = {
    images: PropTypes.array,
    videoId: PropTypes.string
}

ContentFrame.defaultProps = {
    images: [],
    videoId: ''
}

export default ContentFrame
