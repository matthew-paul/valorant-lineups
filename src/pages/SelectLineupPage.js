// @ts-nocheck
import MapInteractionCSS from "../component-utils/map-utils/MapInteractionCSS";
import Map from "../component-utils/map-utils/Map";
import Marker from "../component-utils/map-utils/Marker";
import StartMarker from "../component-utils/map-utils/StartMarker";
import {
  localStorageExpirationTime,
  API_URL,
  AGENT_LIST,
  ABILITY_LIST,
  MAP_LIST,
  TAG_LIST,
} from "../component-utils/constants";

import React, { Component } from "react";
import { GrRotateLeft, GrRotateRight } from "react-icons/gr";
import { MultiSelect } from "react-multi-select-component";
import Select from "react-select";

var localStorageSpace = function () {
  var data = "";

  console.log("Current local storage: ");

  for (var key in window.localStorage) {
    if (window.localStorage.hasOwnProperty(key)) {
      data += window.localStorage[key];
      console.log(
        key +
          " = " +
          ((window.localStorage[key].length * 16) / (8 * 1024)).toFixed(2) +
          " KB"
      );
    }
  }

  console.log(
    data
      ? "\n" +
          "Total space used: " +
          ((data.length * 16) / (8 * 1024)).toFixed(2) +
          " KB"
      : "Empty (0 KB)"
  );
  console.log(
    data
      ? "Approx. space remaining: " +
          (5120 - ((data.length * 16) / (8 * 1024)).toFixed(2)) +
          " KB"
      : "5 MB"
  );
};

const RADIUS = 15;

const getDistance = (point1, point2) => {
  return (
    ((point1["x"] - point2["x"]) ** 2 + (point1["y"] - point2["y"]) ** 2) ** 0.5
  );
};

const getCenter = (point1, point2) => {
  return {
    x: (point1["x"] + point2["x"]) / 2,
    y: (point1["y"] + point2["y"]) / 2,
  };
};

const getClustersFromMarkers = (filteredList) => {
  let clusters = filteredList.map((point) => ({
    center: { x: point["x"], y: point["y"] },
    points: [
      { id: point["id"], startX: point["startX"], startY: point["startY"] },
    ],
    ability: point["ability"],
    agent: point["agent"],
  }));

  let clustersLength = clusters.length;
  let i = 0;
  while (i < clustersLength - 1) {
    let j = i + 1;
    while (
      j < clustersLength &&
      clusters[j]["center"]["x"] - clusters[i]["center"]["x"] < RADIUS
    ) {
      if (clusters[j]["ability"] !== clusters[i]["ability"]) {
        j++;
        continue;
      }

      let distance = getDistance(clusters[i]["center"], clusters[j]["center"]);

      if (distance < RADIUS) {
        clusters[i]["points"].push(...clusters[j]["points"]);
        clusters[i]["center"] = getCenter(
          clusters[i]["center"],
          clusters[j]["center"]
        );
        clusters.splice(j--, 1);

        clustersLength--;
      }

      j++;
    }
    i++;
  }

  return clusters;
};

export class LineupSite extends Component {
  customStyles = {
    container: (styles) => ({
      ...styles,
      width: "25%",
      height: "45px",
      paddingRight: "5px",
    }),
    control: (styles) => ({
      ...styles,
      height: "100%",
    }),
  };

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
    video: "",
    description: "",
    name: "",
    credits: "",
    defaultMapValue: { scale: 0.85, translation: { x: 0, y: 10 } },
    markerScale: 1,
    clusters: [],
    mapArrows: [],
    selectedCluster: null,
    lineupMarkers: [],
  };

  lineupRetrievalRetries = 0;

  componentDidMount() {
    document.title = "View Lineups";

    localStorageSpace();

    // attempt to read lineup info from localstorage and check expiration date
    const localStorageLineups = localStorage.getItem("savedLineups");
    const localStorageLineupsExpirationDate = localStorage.getItem(
      "savedLineupsExpiration"
    );

    // check if it is time to refresh lineups
    if (
      localStorageLineups === null ||
      localStorageLineupsExpirationDate === null ||
      localStorageLineupsExpirationDate.toString().toLowerCase() === "never" ||
      Date.now() >= localStorageLineupsExpirationDate
    ) {
      console.log(
        `refreshing lineups, expiration in ${
          localStorageExpirationTime / 60 / 1000
        } minutes`
      );
      localStorage.clear();

      // store lineups by map in this object, and write it to the state
      let categorizedLineups = {};

      this.getLineupsFromDatabase((lineups) => {
        lineups.forEach((lineup) => {
          let mapId = lineup["mapId"];
          if (mapId in categorizedLineups) {
            categorizedLineups[mapId].push(lineup);
          } else {
            categorizedLineups[mapId] = [lineup];
          }
        });

        this.setState({
          savedLineups: categorizedLineups,
        });

        localStorage.setItem(
          "savedLineups",
          JSON.stringify(categorizedLineups)
        );
        localStorage.setItem(
          "savedLineupsExpiration",
          Date.now() + localStorageExpirationTime
        );
      });
    }
    // otherwise just retrieve lineups from local storage
    else {
      this.setState({
        savedLineups: JSON.parse(localStorageLineups),
      });
    }

    // update hidden markers if user has added them before
    const localStorageHiddenMarkers = localStorage.getItem("hiddenMarkers");
    if (localStorageHiddenMarkers != null) {
      this.setState({
        hiddenMarkers: JSON.parse(localStorageHiddenMarkers),
      });
    }
  }

  getLineupsFromDatabase(callback) {
    let requestOptions = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };

    fetch(`${API_URL}`, requestOptions)
      .then((response) => response.json())
      .then((data) => callback(data))
      .catch((err) => {
        console.log("error retrieving lineups:", err);
      });
  }

  onMapClick = (e) => {
    /*
    let x = e.nativeEvent.offsetX - 12.5  // 1/2 icon size
    let y = e.nativeEvent.offsetY - 12.5

    console.log(x, y)
    */
  };

  getMarkerFromId = (id) => {
    return this.state.visibleMarkers.filter((marker) => marker.id === id)[0];
  };

  onClusterHover = (cluster) => {
    // if start position not given

    let adjustment = 13; // adjustment to center line on 25 x 25 marker icon

    let selectedClusterArrows =
      this.state.selectedCluster !== null
        ? this.state.selectedCluster["points"].map((point) => ({
            x: this.state.selectedCluster["center"]["x"] + adjustment,
            y: this.state.selectedCluster["center"]["y"] + adjustment,
            startX: point["startX"] + adjustment,
            startY: point["startY"] + adjustment,
          }))
        : [];

    let mapArrows = cluster["points"].map((point) => ({
      x: cluster["center"]["x"] + adjustment,
      y: cluster["center"]["y"] + adjustment,
      startX: point["startX"] + adjustment,
      startY: point["startY"] + adjustment,
    }));
    // add coordinates for line
    this.setState({
      mapArrows:
        this.state.selectedCluster !== null
          ? [...selectedClusterArrows, ...mapArrows]
          : mapArrows,
    });
  };

  onClusterOut = (cluster) => {
    // hide arrow when leaving non-selected marker
    // this will allow the user to click the marker and scroll out to view the start location,
    // then when the user hovers over another marker it will clear the red line
    if (this.state.selectedCluster === null) {
      this.setState({
        mapArrows: [],
      });
    } else {
      let mapArrows = this.state.selectedCluster["points"].map((point) => ({
        x: this.state.selectedCluster["center"]["x"] + 13,
        y: this.state.selectedCluster["center"]["y"] + 13,
        startX: point["startX"] + 13,
        startY: point["startY"] + 13,
      }));
      this.setState({
        mapArrows: mapArrows,
      });
    }
  };

  onClusterClick = (cluster) => {
    let mapArrows = cluster["points"].map((point) => ({
      x: cluster["center"]["x"] + 13,
      y: cluster["center"]["y"] + 13,
      startX: point["startX"] + 13,
      startY: point["startY"] + 13,
    }));

    this.setState({
      selectedCluster: cluster,
      mapArrows: mapArrows,
    });

    if (cluster["points"].length === 1) {
      let marker = this.getMarkerFromId(cluster["points"][0]["id"]);
      this.setState(
        {
          // clear images so they will be blank until loaded
          images: [],
        },
        () => {
          this.editMarker(marker);
        }
      );
    }
  };

  editMarker = (marker) => {
    localStorage.setItem("editMarker", JSON.stringify(marker));
    window.open("/edit", "_blank");
  };

  onMapSwitch = (e) => {
    let selectedMap = e.value;

    if (selectedMap === this.state.mapId) {
      return;
    }

    // remove markers
    this.setState({
      clusters: [],
      mapArrows: [],
      selectedCluster: null,
      visibleMarkers: [],
      tags: [],
      name: "",
      description: "",
      credits: "",
      activeMarkerId: null,
      images: [],
      video: "",
    });

    // update map image, Map will automatically call updateMap after image has been loaded
    this.setState({
      mapId: selectedMap,
    });
  };

  onAgentChange = (agent) => {
    // agent = { value: number, label: string }

    // clear map and update abilities
    this.setState(
      {
        clusters: [],
        agentId: agent.value,
        abilityId: 0,
        selectedCluster: null,
        mapArrows: [],
        abilityList: ABILITY_LIST[agent.value],
      },
      this.updateMap
    );
  };

  onAbilityChange = (ability) => {
    // ability = { value: number, label: string }

    this.setState(
      {
        abilityId: ability.value,
        selectedAbility: ability,
      },
      this.updateMap
    );
  };

  onTagChange = (newTags) => {
    this.setState(
      {
        tags: newTags,
      },
      this.updateMap
    );
  };

  updateMap = () => {
    // make sure map and agent is selected
    if (this.state.agentId === 0 || this.state.mapId === 0) {
      this.setState({
        clusters: [],
      });
      return;
    }

    // make sure map has markers saved in state
    if (Object.keys(this.state.savedLineups).length === 0) {
      // retry up to 2 times to give api time to return lineups
      if (this.lineupRetrievalRetries === 2) {
        // don't reset retries because api is only called when component is loaded, so savedLineups will not change after initial call
        return;
      } else {
        this.lineupRetrievalRetries += 1;
        setTimeout(this.updateMap, 1000); // retry updating map after 1 seconds
        return;
      }
    } else if (
      !(this.state.mapId in this.state.savedLineups) ||
      this.state.savedLineups[this.state.mapId].length === 0
    ) {
      return;
    }

    // get marker list and filter based on agent/ability
    let filteredList = this.state.savedLineups[this.state.mapId].filter(
      (marker) => {
        // Check agent and ability matches
        if (parseInt(marker.agent) !== this.state.agentId) return false;
        if (
          this.state.abilityId !== 0 &&
          parseInt(marker.ability) !== this.state.abilityId
        )
          return false;
        if (this.state.hiddenMarkers.includes(marker.id)) return false;
        return true;
      }
    );

    // filter based on tags
    let selectedTagsList = this.state.tags.map((pair) => pair.value);
    if (selectedTagsList.length !== 0) {
      filteredList = filteredList.filter((marker) => {
        return selectedTagsList.every((selectedTag) =>
          marker.tags.includes(selectedTag)
        );
      });
    }

    // TODO: cluster markers based on distance
    filteredList = filteredList.sort((a, b) => {
      return a.x - b.x;
    });

    this.setState({
      mapArrows: [],
      selectedCluster: null,
      visibleMarkers: filteredList,
      clusters: getClustersFromMarkers(filteredList),
    });
  };

  onFilterClick = (e) => {
    e.preventDefault();
  };

  getClusters = () => {
    return this.state.clusters.map((cluster) => (
      <Marker
        key={cluster["points"][0]["id"]}
        lineup={{
          agent: cluster["agent"],
          ability: cluster["ability"],
          x: cluster["center"]["x"],
          y: cluster["center"]["y"],
        }}
        onHover={() => this.onClusterHover(cluster)}
        onLeave={() => this.onClusterOut(cluster)}
        onClick={() => this.onClusterClick(cluster)}
        rotation={this.state.mapRotation}
        scale={this.state.markerScale}
      />
    ));
  };

  getLineupMarkers = (cluster) => {
    if (cluster === null) return <></>;

    if (cluster["points"].length === 1) return <></>;
    else {
      return cluster["points"].map((point, index) => (
        <StartMarker
          key={index}
          x={point.startX}
          y={point.startY}
          scale={this.state.markerScale}
          rotation={this.state.mapRotation}
          onClick={() => this.editMarker(this.getMarkerFromId(point["id"]))}
        />
      ));
    }
  };

  updateScale = (scale) => {
    if (scale !== this.state.markerScale) {
      this.setState({
        markerScale: scale,
      });
    }
  };

  updateLineupState = (newState) => {
    this.setState(
      {
        newState,
      },
      this.updateMap
    );
  };

  clearHiddenMarkers = () => {
    this.setState(
      {
        hiddenMarkers: [],
      },
      this.updateMap
    );
  };

  rotateMapLeft = () => {
    let newRotation = this.state.mapRotation - 90;
    if (newRotation < 0) newRotation += 360;
    this.setState({
      mapRotation: newRotation,
    });
  };

  rotateMapRight = () => {
    let newRotation = this.state.mapRotation + 90;
    if (newRotation >= 360) newRotation -= 360;
    this.setState({
      mapRotation: newRotation,
    });
  };

  render() {
    return (
      <div className="outer-frame">
        <div className="map-frame">
          <div className="filters-frame">
            <Select
              label="Map select"
              defaultValue={MAP_LIST[0]}
              options={MAP_LIST}
              styles={this.customStyles}
              onChange={this.onMapSwitch}
            />
            <Select
              label="Agent select"
              placeholder="Agent..."
              options={AGENT_LIST}
              styles={this.customStyles}
              onChange={this.onAgentChange}
            />
            <Select
              value={this.state.selectedAbility}
              label="Ability select"
              placeholder="Ability..."
              options={this.state.abilityList}
              styles={this.customStyles}
              onChange={this.onAbilityChange}
            />
            <MultiSelect
              className="lineup-filter-multi-select"
              options={TAG_LIST}
              value={this.state.tags}
              labelledBy="Select"
              hasSelectAll={false}
              disableSearch={false}
              overrideStrings={{ selectSomeItems: "Filters..." }}
              onChange={this.onTagChange}
            />
          </div>
          {this.state.hiddenMarkers.length > 0 ? (
            <button
              id="clear-hidden-markers-button"
              onClick={this.clearHiddenMarkers}
            >
              Clear hidden lineups
            </button>
          ) : (
            ""
          )}
          <div className="rotate-button-container">
            <button className="rotate-map-button" onClick={this.rotateMapLeft}>
              <GrRotateLeft />
            </button>
            <button className="rotate-map-button" onClick={this.rotateMapRight}>
              <GrRotateRight />
            </button>
          </div>
          <MapInteractionCSS
            defaultValue={this.state.defaultMapValue}
            updateScale={this.updateScale}
            maxScale={16}
          >
            <div id="lineup-site-map">
              <Map
                rotation={this.state.mapRotation}
                mapId={this.state.mapId}
                onMapClick={this.onMapClick}
                updateMap={this.updateMap}
              />

              {this.state.mapArrows.map((arrow, index) => (
                <svg
                  id={index.toString() + arrow.x}
                  width="1000"
                  height="1000"
                  style={{
                    transform: `rotate(${this.state.mapRotation}deg`,
                    position: "fixed",
                  }}
                >
                  <line
                    x1={arrow.x}
                    y1={arrow.y}
                    x2={arrow.startX}
                    y2={arrow.startY}
                    stroke="red"
                  />
                </svg>
              ))}

              <div
                className="fixed-marker-frame"
                style={{ transform: `rotate(${this.state.mapRotation}deg)` }}
              >
                {this.getClusters()}
                {this.getLineupMarkers(this.state.selectedCluster)}
              </div>
            </div>
          </MapInteractionCSS>
        </div>
      </div>
    );
  }
}

export default LineupSite;
