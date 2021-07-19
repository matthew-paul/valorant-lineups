// @ts-nocheck
import React, { Component } from "react";
import ContentFrame from "../component-utils/lineup-site-utils/ContentFrame";
import MapInteractionCSS from '../component-utils/map-utils/MapInteractionCSS'
import Map from "../component-utils/map-utils/Map";
import Marker from "../component-utils/map-utils/Marker";
import MultiSelect from "react-multi-select-component";
import * as CONSTANTS from "../component-utils/constants";
import Select from 'react-select'

export class LineupSite extends Component {

  customStyles = {
    container: (styles) => ({
      ...styles,
      width: '25%',
      height: '45px',
      paddingRight: '5px'
    }),
    control: (styles) => ({
      ...styles,
      height: '100%',
    })
  }

  state = {
    savedLineups: {},
    visibleMarkers: [],
    hiddenMarkers: [], // user can manually hide markers instead of using filters
    mapId: 1,
    mapRotation: 0,
    agentId: 0,
    abilityId: 0,
    selectedAbility: null, // used to explicitly reset ability selection to empty after changing agent
    abilityList: [],
    activeMarkerId: null, // used in content frame
    tags: [],
    images: [],
    video: '',
    description: '',
    name: '',
    credits: '',
    mapArrowVisible: false, // red svg line from lineup position to start position
    selectedMarkerId: null, // used to keep arrow visible when leaving marker after clicking
    mapArrowPos: {
      x: -1,
      y: -1,
      startX: -1,
      startY: -1,
    },
    markerScale: 1,
  }

  lineupRetrievalRetries = 0;

  componentDidMount() {

    document.title = "View Lineups"

    // attempt to read lineup info from localstorage and check expiration date
    const localStorageLineups = localStorage.getItem('savedLineups');
    const localStorageLineupsExpirationDate = localStorage.getItem('savedLineupsExpiration');


    // check if it is time to refresh lineups
    if (localStorageLineups === null || localStorageLineupsExpirationDate === null || localStorageLineupsExpirationDate.toString().toLowerCase() === 'never' || Date.now() >= localStorageLineupsExpirationDate) {
      console.log(`refreshing lineups, expiration in ${CONSTANTS.localStorageExpirationTime / 60 / 1000} minutes`);
      localStorage.clear();

      // store lineups by map in this object, and write it to the state
      let categorizedLineups = {};

      this.getLineupsFromDatabase((lineups) => {

        lineups.forEach(lineup => {
          let mapId = lineup['mapId'];
          if (mapId in categorizedLineups) {
            categorizedLineups[mapId].push(lineup)
          } else {
            categorizedLineups[mapId] = [lineup]
          }
        });

        this.setState({
          savedLineups: categorizedLineups
        })

        localStorage.setItem('savedLineups', JSON.stringify(categorizedLineups))
        localStorage.setItem('savedLineupsExpiration', Date.now() + CONSTANTS.localStorageExpirationTime)

      })
    }
    // otherwise just retrieve lineups from local storage
    else {
      this.setState({
        savedLineups: JSON.parse(localStorageLineups)
      })
    }

  }

  getLineupsFromDatabase(callback) {
    let requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }

    fetch(`${CONSTANTS.API_URL}`, requestOptions)
      .then(response => response.json())
      .then(data => callback(data))
      .catch(err => {
        console.log('error retrieving lineups:', err)
      })
  }

  onMapClick = (e) => {
    /*
    let x = e.nativeEvent.offsetX - 12.5  // 1/2 icon size
    let y = e.nativeEvent.offsetY - 12.5

    console.log(x, y)
    */
  }

  onMarkerClick = (marker) => {

    this.setState({
      // clear images so they will be blank until loaded
      images: []
    }, () => {
      this.setState({
        activeMarkerId: marker.id,
        selectedMarkerId: marker.id,
        images: marker.images,
        video: marker.video,
        name: marker.name,
        description: marker.description,
        credits: marker.credits,
        mapArrowVisible: true
      })
    })

  }

  onMarkerHover = (marker) => {
    // if start position not given
    if (marker.startX === -1) return;

    let adjustment = 13;

    // add coordinates for line
    this.setState({
      mapArrowPos: {
        x: marker.x + adjustment,
        y: marker.y + adjustment,
        startX: marker.startX + adjustment,
        startY: marker.startY + adjustment
      },
      mapArrowVisible: true
    })

  }

  onMarkerOut = (marker) => {
    // hide arrow when leaving non-selected marker
    // this will allow the user to click the marker and scroll out to view the start location,
    // then when the user hovers over another marker it will clear the red line
    if (this.state.selectedMarkerId !== marker.id) {
      this.setState({
        selectedMarkerId: false,
        mapArrowVisible: false
      })
    }
  }

  onMapSwitch = (e) => {

    let selectedMap = e.value

    // remove markers
    this.setState({
      mapRotation: 0,
      mapArrowVisible: false,
      visibleMarkers: [],
      tags: []
    })

    // update map image, Map will automatically call updateMap after image has been loaded
    this.setState({
      mapId: selectedMap
    })



  }

  onAgentChange = (agent) => {
    // agent = { value: number, label: string }

    // clear map and update abilities
    this.setState({
      visibleMarkers: [],
      agentId: agent.value,
      abilityId: 0,
      selectedAbility: null,
      abilityList: CONSTANTS.ABILITY_LIST[agent.value]
    }, this.updateMap)

  }

  onAbilityChange = (ability) => {

    // ability = { value: number, label: string }

    this.setState({
      abilityId: ability.value,
      selectedAbility: ability
    }, this.updateMap);

  }

  onTagChange = (newTags) => {
    this.setState({
      tags: newTags
    }, this.updateMap)

  }

  updateMap = () => {

    // make sure map and agent is selected
    if (this.state.agentId === 0 || this.state.mapId === 0) {
      this.setState({
        visibleMarkers: []
      })
      return;
    }

    // make sure map has markers saved in state
    if (Object.keys(this.state.savedLineups).length === 0) {
      // retry up to 2 times to give api time to return lineups
      if (this.lineupRetrievalRetries === 2) {
        // don't reset retries because api is only called when component is loaded, so savedLineups will not change after initial call
        alert('No lineups retrieved. Please retry in a few seconds/clear cache.')
        this.lineupRetrievalRetries += 1
        return;
      } else if (this.lineupRetrievalRetries > 2) {
        return;
      } else {
        this.lineupRetrievalRetries += 1;
        setTimeout(this.updateMap, 1000); // retry updating map after 1 seconds
        return;
      }
    } else if (!(this.state.mapId in this.state.savedLineups) || this.state.savedLineups[this.state.mapId].length === 0) {
      return;
    }

    // get marker list and filter based on agent/ability
    let filteredList = this.state.savedLineups[this.state.mapId].filter(marker => {
      // Check agent and ability matches
      if (parseInt(marker.agent) !== this.state.agentId) return false;
      if (this.state.abilityId !== 0 && parseInt(marker.ability) !== this.state.abilityId) return false;
      if (this.state.hiddenMarkers.includes(marker.id)) return false;
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
      mapArrowVisible: false,
      visibleMarkers: filteredList
    })

  }

  onFilterClick = (e) => {
    e.preventDefault();
  }

  getMarkers = () => {
    return (
      this.state.visibleMarkers.map((marker) =>
        <Marker
          key={marker.id}
          lineup={marker}
          rotation={this.state.mapRotation}
          onClick={() => this.onMarkerClick(marker)}
          onHover={() => this.onMarkerHover(marker)}
          onLeave={() => this.onMarkerOut(marker)}
          scale={this.state.markerScale} />)
    )
  }

  updateScale = (scale) => {
    if (scale !== this.state.markerScale) {
      this.setState({
        markerScale: scale
      })
    }
  }

  updateLineupState = (newState) => {
    this.setState({
      newState
    }, this.updateMap)
  }

  clearHiddenMarkers = () => {
    this.setState({
      hiddenMarkers: []
    }, this.updateMap)
  }

  rotateMapLeft = () => {
    let newRotation = this.state.mapRotation - 90
    if (newRotation < 0) newRotation += 360
    this.setState({
      mapRotation: newRotation
    })
  }

  rotateMapRight = () => {
    let newRotation = this.state.mapRotation + 90
    if (newRotation >= 360) newRotation -= 360
    this.setState({
      mapRotation: newRotation
    })
  }

  render() {

    return (
      <div className='outer-frame'>
        <div className='map-frame'>
          <div className='filters-frame' >
            <Select label="Map select" defaultValue={CONSTANTS.MAP_LIST[0]} options={CONSTANTS.MAP_LIST} styles={this.customStyles} onChange={this.onMapSwitch} />
            <Select label="Agent select" placeholder='Agent...' options={CONSTANTS.AGENT_LIST} styles={this.customStyles} onChange={this.onAgentChange} />
            <Select value={this.state.selectedAbility} label="Ability select" placeholder='Ability...' options={this.state.abilityList} styles={this.customStyles} onChange={this.onAbilityChange} />
            <MultiSelect
              className='lineup-filter-multi-select'
              options={CONSTANTS.TAG_LIST}
              value={this.state.tags}
              labelledBy="Select"
              hasSelectAll={false}
              disableSearch={false}
              overrideStrings={{ 'selectSomeItems': 'Filters...' }}
              onChange={this.onTagChange} />
          </div>
          <button id='clear-hidden-markers-button' onClick={this.clearHiddenMarkers}>Clear hidden markers</button>
          <div className='rotate-button-container'>
            <button className='rotate-map-button' onClick={this.rotateMapLeft}>Rotate left</button>
            <button className='rotate-map-button' onClick={this.rotateMapRight}>Rotate right</button>
          </div>
          <MapInteractionCSS
            updateScale={this.updateScale}
            maxScale={15}>
            <div id='lineup-site-map'>
              <Map rotation={this.state.mapRotation} mapId={this.state.mapId} onMapClick={this.onMapClick} updateMap={this.updateMap} />

              {this.state.mapArrowVisible &&
                <svg width="1000" height="1000" style={{ transform: `rotate(${this.state.mapRotation}deg`, position: 'fixed' }}>
                  <line x1={this.state.mapArrowPos.x} y1={this.state.mapArrowPos.y} x2={this.state.mapArrowPos.startX} y2={this.state.mapArrowPos.startY} stroke="red" />
                </svg>
              }

              <div className='marker-frame' style={{ transform: `rotate(${this.state.mapRotation}deg)` }} >
                {this.getMarkers()}
              </div>
            </div>
          </MapInteractionCSS>
        </div>

        <ContentFrame updateParentState={this.updateLineupState}
          activeMarkerId={this.state.activeMarkerId}
          hiddenMarkers={this.state.hiddenMarkers}
          name={this.state.name}
          description={this.state.description}
          credits={this.state.credits}
          video={this.state.video}
          images={this.state.images} />
      </div >
    );
  }

}

export default LineupSite;
