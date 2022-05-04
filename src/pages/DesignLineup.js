// @ts-nocheck
import React, { Component } from "react";
//import { AGENT_LIST, ABILITY_LIST, MAP_LIST, TAG_LIST } from './constants'

import DesignForm from "../component-utils/design-utils/DesignForm.js";
import MapInteractionCSS from "../component-utils/map-utils/MapInteractionCSS.js";
import Map from "../component-utils/map-utils/Map.js";
import Marker from "../component-utils/map-utils/Marker.js";
import startIcon from "../resources/start-icon.png";
import { MAP_LIST } from "../component-utils/constants.js";
import Select from "react-select";

export class DesignLineup extends Component {
  componentDidMount() {
    document.title = "Create Lineup";
  }

  customStyles = {
    container: (styles) => ({
      ...styles,
      width: "33%",
      height: "100%",
      margin: "auto",
    }),
    control: (styles) => ({
      ...styles,
      height: "100%",
    }),
  };

  state = {
    name: "",
    description: "",
    agent: 0, // actual agent list starts at 1
    ability: 0, // actual ability list starts at 1
    map: MAP_LIST[0],
    tags: [],
    images: [],
    video: "",
    credits: "",
    x: -1,
    y: -1,
    startX: -1,
    startY: -1,
    infoMessage: { type: "info", value: "" },
    apiKey: "",
  };

  constructor(props) {
    super(props);

    this.settingLineupPosition = false;
    this.settingStartPosition = false;
  }

  updateState = (values, callback) => {
    this.setState(values, callback);
  };

  onMapClick = (e) => {
    let x = e.nativeEvent.offsetX - 12.5; // 1/2 icon size
    let y = e.nativeEvent.offsetY - 12.5;

    if (0 > x || x > 1000 || 0 > y || y > 1000) {
      return;
    }

    if (this.settingLineupPosition) {
      this.setState({
        x: x,
        y: y,
      });
    }

    if (this.settingStartPosition) {
      this.setState({
        startX: x,
        startY: y,
      });
    }

    this.settingLineupPosition = false;
    this.settingStartPosition = false;
  };

  validLineupState = () => {
    // Get tag list
    if (this.state.name === "") {
      this.setState({
        infoMessage: { type: "error", value: "Enter a lineup title" },
      });
      return false;
    }

    if (this.state.agent === null) {
      this.setState({
        infoMessage: { type: "error", value: "Select an agent" },
      });
      return false;
    }

    if (this.state.ability === null) {
      this.setState({
        infoMessage: { type: "error", value: "Select an ability" },
      });
      return false;
    }

    if (this.state.images.length === 0) {
      this.setState({
        infoMessage: { type: "error", value: "Enter an image link" },
      });
      return false;
    }

    if (this.state.video === "") {
      this.setState({
        infoMessage: { type: "error", value: "Enter a youtube video id" },
      });
      return false;
    }

    if (this.state.x === -1) {
      this.setState({
        infoMessage: { type: "error", value: "Select a lineup position" },
      });
      return false;
    }

    return true;
  };

  sendLineupToDB = () => {
    // only use tag numbers to save data
    let tagList = this.state.tags.map((pair) => pair.value);
    let imageList = this.state.images.map((pair) => pair.text);

    let re = /^https:\/\/youtu\.be\/(.*)$/g;

    let videoString;
    try {
      videoString = re.exec(this.state.video)[1];
    } catch (err) {
      this.setState({
        infoMessage: { type: "error", value: "invalid video: " + err.message },
      });
      console.log("error reading video: " + err.message);
      return;
    }

    // id will be created on server side
    let lineupData = {
      name: this.state.name,
      description: this.state.description,
      agent: this.state.agent.value,
      ability: this.state.ability.value,
      mapId: this.state.map.value,
      tags: tagList,
      images: imageList,
      video: videoString,
      credits: this.state.credits,
      x: this.state.x,
      y: this.state.y,
      startX: this.state.startX,
      startY: this.state.startY,
    };

    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.state.apiKey,
        "request-type": "add",
      },
      body: JSON.stringify(lineupData),
    };

    fetch(
      "https://uh5it8zn19.execute-api.us-east-1.amazonaws.com/development",
      requestOptions
    )
      .then((response) => response.text())
      .then((data) => {
        this.setState({
          infoMessage: { type: "success", value: "Sent lineup to database" },
          name: "",
          description: "",
          tags: [],
          images: [],
          video: "",
          credits: "",
          x: -1,
          y: -1,
          startX: -1,
          startY: -1,
        });
      })
      .catch((err) => {
        console.log("error sending lineup:", err);
        this.setState({
          infoMessage: {
            type: "error",
            value: "Error sending lineup to database: " + err,
          },
        });
      });
  };

  onSubmit = (e) => {
    // prevent page auto refresh
    e.preventDefault();

    this.setState({
      infoMessage: { type: "info", value: "Sending..." },
    });

    // validate input
    if (!this.validLineupState()) {
      return;
    }

    // send state to dynamodb
    this.sendLineupToDB();
  };

  onContextMenu = (event) => {
    event.preventDefault();
  };

  setLineupPositionClicked = () => {
    if (this.settingStartPosition) {
      this.settingStartPosition = false;
    }
    this.settingLineupPosition = true;
  };

  setStartPositionClicked = () => {
    if (this.settingLineupPosition) {
      this.settingLineupPosition = false;
    }
    this.settingStartPosition = true;
  };

  onMapChange = (map) => {
    // example: { value: 1, label: "Ascent", icon: AscentMap }
    let selectedMap = map;

    if (selectedMap === this.state.map) {
      return;
    }

    // update map image, Map will automatically call updateMap after image has been loaded
    this.setState({
      map: selectedMap,
    });
  };

  updateScale = () => {};

  render() {
    return (
      <div className="design-outer-frame">
        <h1 className="design-site-header">LINEUP CREATION</h1>
        <div className="design-form-frame">
          <div className="map-and-buttons">
            <div className="map-select-point">
              <Select
                label="Map select"
                value={this.state.map}
                defaultValue={MAP_LIST[0]}
                options={MAP_LIST}
                styles={this.customStyles}
                onChange={this.onMapChange}
              />
              <button
                className="map-button"
                onClick={this.setLineupPositionClicked}
              >
                Set Lineup Position
              </button>
              <button
                className="map-button"
                onClick={this.setStartPositionClicked}
              >
                Set Start Position
              </button>
            </div>
            <div
              className="design-map-frame"
              onContextMenu={this.onContextMenu}
            >
              <MapInteractionCSS updateScale={this.updateScale} maxScale={6}>
                <Map map={this.state.map} onMapClick={this.onMapClick} />

                <div>
                  {this.state.x !== -1 ? (
                    // Show marker if x and y have already been set
                    <Marker
                      lineup={this.state}
                      // remove marker when it is clicked
                      onClick={() => {
                        this.setState({ x: -1, y: -1 });
                      }}
                    />
                  ) : (
                    ""
                  )}
                  {this.state.startX !== -1 ? (
                    <img
                      className="marker-icon"
                      src={startIcon}
                      alt="start position"
                      style={{
                        left: `${this.state.startX}px`,
                        top: `${this.state.startY}px`,
                      }}
                      onClick={() => {
                        this.setState({ startX: -1, startY: -1 });
                      }}
                    />
                  ) : (
                    ""
                  )}
                </div>
              </MapInteractionCSS>
            </div>
          </div>
          <DesignForm
            updateState={this.updateState}
            onSubmit={this.onSubmit}
            state={this.state}
          />
        </div>
      </div>
    );
  }
}

export default DesignLineup;
