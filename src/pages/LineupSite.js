// @ts-nocheck
import React, { PureComponent } from "react";
import ContentFrame from "../component-utils/lineup-site-utils/ContentFrame";
import MapInteractionCSS from '../component-utils/map-utils/MapInteractionCSS'
import Map from "../component-utils/map-utils/Map";
import Marker from "../component-utils/map-utils/Marker";
import MultiSelect from "react-multi-select-component";
import * as CONSTANTS from "../component-utils/constants";
import { dictToArray } from "../component-utils/Utils";


export class LineupSite extends PureComponent {


  state = {
    savedMarkers: {},
    visibleMarkers: [],
    mapId: 1,
    agentId: 0,
    abilityId: 0,
    abilityList: [],
    activeMarkerId: null,
    tags: [],
    images: [],
    video: '',
    description: '',
    name: '',
    credits: '',
    mapValues: {
      scale: 0.9,
      translation: { x: 50, y: 30 }
    }
  }

  componentDidMount() {
    this.requestMapMarkers(this.state.mapId);

  }

  requestMapMarkers(mapId) {
    let requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }

    fetch(`${CONSTANTS.API_URL}?mapId=${mapId}`, requestOptions)
      .then(response => response.json())
      .then(data => this.recievedLineups(data))
      .catch(err => {
        console.log('error retrieving lineups:', err)
      })
  }

  recievedLineups(data) {
    // append lineups for this map to what we already saved
    // so we don't make unecessary api calls when switching maps

    this.setState({
      savedMarkers: {
        ...this.state.savedMarkers,
        [this.state.mapId]: data
      }
    })
  }

  onMapClick(e) {

  }

  onMarkerClick = (marker) => {

    this.setState({
      images: marker.images,
      video: marker.video
    })

    console.log(marker.id)
  }

  async onMapChange(e) {

    let selectedMap = parseInt(e.target.value);

    // remove markers
    this.setState({
      visibleMarkers: []
    })

    // update map image

    await this.setState({
      mapId: selectedMap
    })

    // check if we already have markers in state for this map
    if (!(selectedMap in this.state.savedMarkers)) {
      // request api for new markers
      await this.requestMapMarkers(selectedMap)
    }

    // update map with markers
    this.updateMap()

  }

  onAgentChange(e) {
    // clear map

    this.setState({
      visibleMarkers: []
    })

    // update abilities
    this.setState({
      agentId: e.target.value,
      abilityId: 0,
      abilityList: CONSTANTS.ABILITY_LIST[e.target.value]
    }, () => {
      this.updateMap()
    })
  }

  onAbilityChange(e) {

    this.setState({
      abilityId: e.target.value
    }, () => {
      this.updateMap()
    });

  }

  onTagChange = (newTags) => {
    this.setState({
      tags: newTags
    }, () => {
      this.updateMap();
    })

  }

  updateMap() {
    // make sure map and agent is selected
    if (this.state.agentId === 0 || this.state.mapId === 0) {
      this.setState({
        visibleMarkers: []
      })
      return;
    }

    // make sure map has markers saved in state
    if (!(this.state.mapId in this.state.savedMarkers) || this.state.savedMarkers[this.state.mapId].length === 0)
      return;

    // get marker list and filter based on agent/ability
    let filteredList = this.state.savedMarkers[this.state.mapId].filter(marker => {
      // Check agent and ability matches
      if (marker.agent !== this.state.agentId) return false;
      if (this.state.abilityId !== 0 && marker.ability !== this.state.abilityId) return false;
      return true;
    })

    // filter based on tags
    let selectedTagsList = this.state.tags.map((pair) => pair.value);
    if (selectedTagsList.length !== 0) {
      filteredList = filteredList.filter((marker) => {
        return selectedTagsList.every((selectedTag) => marker.tags.includes(selectedTag));
      })
    }

    this.setState({
      visibleMarkers: filteredList
    })

  }

  render() {
    return (
      <div className='outer-frame'>
        <div className='map-frame'>
          <div className='filters-frame' >
            <select className='lineup-filter-select' name='map' onChange={e => this.onMapChange(e)}>
              {/*<option value={0}> -- Map -- </option>*/}
              {dictToArray(CONSTANTS.MAP_LIST).map((map) =>
                <option key={map[0]} value={map[0]}>
                  {map[1]}
                </option>
              )}
            </select>
            <select className='first-opt-hidden lineup-filter-select' name='agent' onChange={e => this.onAgentChange(e)}>
              <option value={0}> -- Agent -- </option>
              {dictToArray(CONSTANTS.AGENT_LIST).map((agent) =>
                <option key={agent[0]} value={agent[0]}>
                  {agent[1]}
                </option>
              )}
            </select>
            <select className='first-opt-hidden lineup-filter-select' name='ability' onChange={e => this.onAbilityChange(e)}>
              <option value={0}> -- Ability -- </option>
              {dictToArray(this.state.abilityList).map((ability) =>
                <option key={ability[0]} value={ability[0]}>
                  {ability[1]}
                </option>
              )}
            </select>
            <MultiSelect
              className='lineup-filter-multi-select'
              options={CONSTANTS.TAG_LIST}
              value={this.state.tags}
              labelledBy="Select"
              hasSelectAll={false}
              disableSearch={true}
              overrideStrings={{ 'selectSomeItems': 'Select Tags...' }}
              onChange={this.onTagChange} />
          </div>
          <MapInteractionCSS
            value={this.state.mapValues}
            onChange={(value) => this.setState({ mapValues: value })}
            maxScale={6}>
            <Map mapId={this.state.mapId} onMapClick={this.onMapClick} />

            <div className='marker-frame'>
              {this.state.visibleMarkers.map((marker) => <Marker key={marker.id} lineup={marker} onClick={() => this.onMarkerClick(marker)} />)}
            </div>
          </MapInteractionCSS>
        </div>

        <ContentFrame images={this.state.images} videoId={this.state.video} />
      </div>
    );
  }

}

export default LineupSite;
