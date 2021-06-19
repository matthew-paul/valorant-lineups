// @ts-nocheck
import React, { Component } from "react";
import ContentFrame from "./ContentFrame";
import MapInteractionCSS from '../component-utils/MapInteractionCSS'
import Map from "../component-utils/Map";
import Marker from "./Marker";
import lineups from './sampleLineup.json'


export class LineupSite extends Component {

  state = {
    activeMarkerId: null,
    images: lineups[0].images,
    video: lineups[0].video,
    description: '',
    name: '',
    credits: '',
  }

  componentDidMount() {
    console.log('site mounted')

    // TODO: retrieve all lineups for this map from api
  }

  onMapClick = (e) => {
    console.log(e.nativeEvent.offsetX - 12.5, e.nativeEvent.offsetY - 12.5)
  }

  onMarkerClick = (id) => {
    // TODO: update state with lineup info

    console.log(id)
  }

  render() {
    return (
      <div className='outer-frame'>
        <div className='map-frame'>
          <MapInteractionCSS maxScale={6}>
            <Map mapId={this.props.mapId} onMapClick={this.onMapClick} />

            <div className='marker-frame'>
              {lineups.map((lineup) => <Marker key={lineup.id} lineup={lineup} onClick={() => this.onMarkerClick(lineup.id)} />)}
            </div>
          </MapInteractionCSS>
        </div>

        <ContentFrame images={this.state.images} videoId={this.state.video} />
      </div>
    );
  }

}

export default LineupSite;
