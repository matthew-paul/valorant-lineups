// @ts-nocheck
import React, { Component } from "react";
import MapFrame from "./MapFrame";
import ContentFrame from "./ContentFrame";


export class LineupSite extends Component {

  constructor(props) {
    super(props)
    this.activeMarker = null;
  }

  componentDidMount() {
    console.log('site mounted')

    // TODO: retrieve all lineups for this map from api
  }

  onMarkerClick = (id) => {
    // Connect to db and get images for marker id

    console.log(id)
  }

  render() {
    return (
      <div className='outer-frame'>
        <MapFrame mapId={this.props.mapId} onMarkerClick={this.onMarkerClick} />
        <ContentFrame image={'https://valorant-lineups.s3.amazonaws.com/Agents/Sova/LineupImages/lineup-1-1.png'} />
      </div>
    );
  }

}

export default LineupSite;
