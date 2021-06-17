import React from 'react'
import ImageFrame from './ImageFrame'
import YoutubeEmbed from "./YoutubeEmbed"
import disableScroll from 'disable-scroll'


const ContentFrame = ({ image }) => {


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
            <div className='video-frame'>
                <YoutubeEmbed embedId="7A0_-C4HSFw" />
            </div>
            < ImageFrame image={image} enterImageFocus={enterImageFocus} exitImageFocus={exitImageFocus} />
            < ImageFrame image={image} enterImageFocus={enterImageFocus} exitImageFocus={exitImageFocus} />
        </div>
    )
}

export default ContentFrame
