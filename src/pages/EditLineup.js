// @ts-nocheck
import React, { Component } from "react";
//import { AGENT_LIST, ABILITY_LIST, MAP_LIST, TAG_LIST } from './constants'

import Form from "../component-utils/edit-utils/Form.js";
import MapInteractionCSS from "../component-utils/map-utils/MapInteractionCSS.js";
import Map from "../component-utils/map-utils/Map.js";
import Marker from "../component-utils/map-utils/Marker.js";
import startIcon from "../resources/start-icon.png";
import {
  MAP_LIST,
  getAgentFromId,
  getAbilityFromId,
  getTagsFromIds,
  getImagesFromIds,
} from "../component-utils/constants.js";
import Select from "react-select";

export class EditLineup extends Component {
  componentDidMount() {
    let marker = JSON.parse(localStorage.getItem("editMarker"));

    this.setState({
      marker: marker, // used to store previous values
      id: marker.id, // id does not change for edit/delete, always created from aws request
      newName: marker.name,
      newDescription: marker.description,
      newMapId: marker.mapId,
      newAgent: getAgentFromId(marker.agent),
      newAbility: getAbilityFromId(marker.agent, marker.ability),
      newTags: getTagsFromIds(marker.tags),
      newImages: getImagesFromIds(marker.images),
      newVideo: marker.video,
      newCredits: marker.credits,
      newX: marker.x,
      newY: marker.y,
      newStartX: marker.startX,
      newStartY: marker.startY,
    });

    console.log(marker);

    document.title = "Edit Lineup";
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

  constructor(props) {
    super(props);

    this.settingLineupPosition = false;
    this.settingStartPosition = false;
    this.defaultState = {
      marker: {},
      id: "",
      newName: "",
      newDescription: "",
      newAgent: 0, // actual agent list starts at 1
      newAbility: 0, // actual ability list starts at 1
      newMapId: 1,
      newTags: [],
      newImages: [],
      newVideo: "",
      newCredits: "",
      newX: -1,
      newY: -1,
      newStartX: -1,
      newStartY: -1,
      infoMessage: { type: "info", value: "" },
      apiKey: "",
      defaultMapValue: { scale: 0.85, translation: { x: 0, y: 0 } },
      requestType: "edit",
    };
    this.state = this.defaultState;
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
        newX: x,
        newY: y,
      });
    }

    if (this.settingStartPosition) {
      this.setState({
        newStartX: x,
        newStartY: y,
      });
    }

    this.settingLineupPosition = false;
    this.settingStartPosition = false;
  };

  validLineupState = () => {
    // Get tag list
    if (this.state.newName === "") {
      this.setState({
        infoMessage: { type: "error", value: "Enter a lineup title" },
      });
      return false;
    }

    if (this.state.newAgent === 0) {
      this.setState({
        infoMessage: { type: "error", value: "Select an agent" },
      });
      return false;
    }

    if (this.state.newAbility === 0) {
      this.setState({
        infoMessage: { type: "error", value: "Select an ability" },
      });
      return false;
    }

    if (this.state.newImages.length === 0) {
      this.setState({
        infoMessage: { type: "error", value: "Enter an image link" },
      });
      return false;
    }

    if (this.state.newVideo === "") {
      this.setState({
        infoMessage: { type: "error", value: "Enter a youtube video id" },
      });
      return false;
    }

    if (this.state.newX === -1) {
      this.setState({
        infoMessage: { type: "error", value: "Select a lineup position" },
      });
      return false;
    }

    return true;
  };

  sendUpdateToDB = () => {
    // only use tag numbers to save data
    let tagList = this.state.newTags.map((pair) => pair.value);
    let imageList = this.state.newImages.map((pair) => pair.text);
    let lineupData;

    if (this.state.requestType === "delete") {
      // id will be created on server side
      lineupData = {
        id: this.state.id,
        mapId: this.state.marker.mapId,
      };
    } else {
      lineupData = {
        id: this.state.id, // id does not change for edit/delete, always created from aws request
        name: this.state.newName,
        description: this.state.newDescription,
        agent: this.state.newAgent.value,
        ability: this.state.newAbility.value,
        mapId: this.state.newMapId,
        tags: tagList,
        images: imageList,
        video: this.state.newVideo,
        credits: this.state.newCredits,
        x: this.state.newX,
        y: this.state.newY,
        startX: this.state.newStartX,
        startY: this.state.newStartY,
      };
    }

    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.state.apiKey,
        "request-type": this.state.requestType,
      },
      body: JSON.stringify(lineupData),
    };

    console.log(requestOptions);

    fetch(
      "https://uh5it8zn19.execute-api.us-east-1.amazonaws.com/development",
      requestOptions
    )
      .then((response) => response.text())
      .then((data) => {
        this.setState({
          infoMessage: {
            type: "success",
            value: data,
          },
          deleteInsteadOfEdit: false,
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

  onSubmit = (e, requestType) => {
    // prevent page auto refresh
    e.preventDefault();

    this.setState({
      infoMessage: { type: "info", value: "" },
    });

    // validate input
    if (!this.validLineupState()) {
      return;
    }

    // send state to dynamodb
    this.setState(
      {
        requestType: requestType,
      },
      () => {
        this.sendUpdateToDB();
      }
    );
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
    this.setState({
      newMapId: map.value,
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
              <MapInteractionCSS
                updateScale={this.updateScale}
                maxScale={10}
                defaultValue={this.state.defaultMapValue}
              >
                <Map mapId={this.state.newMapId} onMapClick={this.onMapClick} />

                <div>
                  {this.state.newX !== -1 ? (
                    <Marker
                      lineup={{
                        agent: this.state.newAgent.value,
                        ability: this.state.newAbility.value,
                        x: this.state.newX,
                        y: this.state.newY,
                      }}
                      onClick={() => {
                        this.setState({ newX: -1, newY: -1 });
                      }}
                    />
                  ) : (
                    ""
                  )}
                  {this.state.newStartX !== -1 ? (
                    <img
                      className="marker-icon"
                      src={startIcon}
                      alt="recon bolt"
                      style={{
                        left: `${this.state.newStartX}px`,
                        top: `${this.state.newStartY}px`,
                      }}
                      onClick={() => {
                        this.setState({ newStartX: -1, newStartY: -1 });
                      }}
                    />
                  ) : (
                    ""
                  )}
                </div>
              </MapInteractionCSS>
            </div>
          </div>
          <Form
            updateParent={this.updateState}
            onSubmit={this.onSubmit}
            infoMessage={this.state.infoMessage}
            state={this.state}
          />
        </div>
      </div>
    );
  }
}

export default EditLineup;
