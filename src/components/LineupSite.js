// @ts-nocheck
import React from "react";
import MapFrame from "./MapFrame";
import ContentFrame from "./ContentFrame";
import lineupImage from '../resources/Agents/Sova/lineups/lineup-1-1.png'
import { useState } from 'react'

const LineupSite = () => {

  const [image, setImage] = useState(lineupImage)

  const onMarkerClick = (id) => {
    // Connect to db and get images for marker id
    setImage(lineupImage)

    console.log(id)
  }

  return (
    <div className='outer-frame'>
      <MapFrame mapName='ascent' onMarkerClick={onMarkerClick}/>
      <ContentFrame image={image}/>
    </div>
  );

}

export default LineupSite;
