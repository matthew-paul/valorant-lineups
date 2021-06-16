import React from 'react'
import ImageFrame from './ImageFrame'
import YoutubeEmbed from "./YoutubeEmbed"


const ContentFrame = ({ image }) => {

    const handleScroll = (e) => {
        e.preventDefault()
        console.log(e)
        console.log('scrolled')
    }

    return (
        <div className='content-frame' onScrollCapture={handleScroll}>
            < ImageFrame image={image} />
            <div className='video-frame'>
                <YoutubeEmbed embedId="7A0_-C4HSFw" />
            </div>
        </div>
    )
}

export default ContentFrame
