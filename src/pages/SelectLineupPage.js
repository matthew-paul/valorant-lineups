// @ts-nocheck
import MapInteractionCSS from "../component-utils/map-utils/MapInteractionCSS";
import Map from "../component-utils/map-utils/Map";
import Marker from "../component-utils/map-utils/Marker";
import StartMarker from "../component-utils/map-utils/StartMarker";
import {
  getAgentFromId,
  getAbilityFromId,
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
      minWidth: "70px",
      height: "45px",
      paddingRight: "5px",
    }),
    control: (styles) => ({
      ...styles,
      height: "100%",
    }),
  };

  // default values
  state = {
    loadingText: "loading lineups...",
    savedLineups: {},
    enabledMarkers: [],
    hiddenMarkers: [], // user can manually hide markers instead of using filters
    map: MAP_LIST[0], // selected map, default ascent
    mapRotation: 0, // 0, 90, 180, 270 degrees
    agent: { value: 13, label: "Sova" }, // selected agent, default sova
    ability: null, // selected ability, default none = all abilities
    filters: [], // filters
    activeMarkerId: null, // used in content frame, id of lineup that is clicked
    lineupTags: [], // tags for lineup
    name: "",
    description: "",
    credits: "",
    video: "",
    images: [],
    defaultMapValue: { scale: 0.85, translation: { x: 0, y: 10 } },
    markerScale: 1, // adjust scale based on map zoom level
    clusters: [], // each marker is a cluster of multiple points, if there is only one lineup for a cluster it uses that automatically when clicked
    mapArrows: [], // lines leading from starting point to lineup position
    selectedCluster: null, // shows multiple lines if there are multiple lineups per marker
    lineupMarkers: [], // starting points shown when a cluster with multiple markers is clicked
  };

  componentDidMount() {
    document.title = "View Lineups";

    localStorageSpace();

    // attempt to read lineup info from localstorage and check expiration date
    const localStorageLineups = localStorage.getItem("savedLineups");
    const localStorageLastRetrievedTime = localStorage.getItem(
      "lastRetrievedTime"
    );

    let allLineups = [];
    // store lineups by map in this object, and write it to the state
    let categorizedLineups = {};

    // check if it is time to refresh lineups
    if (
      localStorageLineups === null ||
      localStorageLastRetrievedTime === null ||
      localStorageLastRetrievedTime.toString().toLowerCase() === "never" ||
      localStorageLastRetrievedTime + localStorageExpirationTime >= Date.now()
    ) {
      console.log(
        `refreshing lineups, expiration in ${
          localStorageExpirationTime / 60 / 1000
        } minutes`
      );
      localStorage.removeItem("savedLineups");

      this.getLineupsFromDatabase((lineups) => {
        allLineups = lineups;
        lineups.forEach((lineup) => {
          let mapId = lineup["mapId"];
          if (mapId in categorizedLineups) {
            categorizedLineups[mapId].push(lineup);
          } else {
            categorizedLineups[mapId] = [lineup];
          }
        });

        localStorage.setItem(
          "savedLineups",
          JSON.stringify(categorizedLineups)
        );
        localStorage.setItem(
          "lastRetrievedTime",
          Date.now()
        );

        this.setState({ savedLineups: categorizedLineups }, this.updateMap);
      });
    }
    // otherwise just retrieve lineups from local storage
    else {
      categorizedLineups = JSON.parse(localStorageLineups);
      this.setState({ savedLineups: categorizedLineups }, this.updateMap);
      let key;
      for (key in categorizedLineups) {
        allLineups.push(...categorizedLineups[key]);
      }
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
    return this.state.enabledMarkers.filter((marker) => marker.id === id)[0];
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

  updateActiveMarker = (marker) => {
    this.editMarker(marker);
  };

  onMapSwitch = (map) => {
    // example: { value: 1, label: "Ascent", icon: AscentMap }
    let selectedMap = map;

    if (selectedMap === this.state.map) {
      return;
    }

    // remove markers
    this.setState({
      clusters: [],
      mapArrows: [],
      selectedCluster: null,
      enabledMarkers: [],
      filters: [],
      name: "",
      lineupTags: [],
      description: "",
      credits: "",
      activeMarkerId: null,
      images: [],
      video: "",
    });

    // update map image, Map will automatically call updateMap after image has been loaded
    this.setState({
      map: selectedMap,
    });
  };

  onAgentChange = (agent) => {
    // agent = { value: number, label: string }

    // clear map and update abilities
    this.setState(
      {
        clusters: [],
        agent: agent,
        ability: null,
        selectedCluster: null,
        mapArrows: [],
      },
      this.updateMap
    );
  };

  onAbilityChange = (ability) => {
    // ability = { value: number, label: string }

    this.setState(
      {
        ability: ability,
      },
      this.updateMap
    );
  };

  onTagChange = (newTags) => {
    this.setState(
      {
        mapArrows: [],
        filters: newTags,
      },
      this.updateMap
    );
  };

  updateMap = () => {
    this.setState({ loadingText: "loading..." });
    // make sure map and agent is selected
    if (this.state.agent === null || this.state.map === null) {
      this.setState({
        clusters: [],
        loadingText: "",
      });
      return;
    }

    if (this.state.savedLineups[this.state.map.value] === undefined) {
      return;
    }

    console.log(this.state.savedLineups[this.state.map.value]);

    // get marker list and filter based on agent/ability
    let filteredList = this.state.savedLineups[this.state.map.value].filter(
      (marker) => {
        // Check agent and ability matches
        if (parseInt(marker.agent) !== this.state.agent.value) return false;
        if (
          this.state.ability !== null &&
          parseInt(marker.ability) !== this.state.ability.value
        )
          return false;
        if (this.state.hiddenMarkers.includes(marker.id)) return false;
        return true;
      }
    );

    // filter based on tags
    let filtersList = this.state.filters.map((pair) => pair.value);
    if (filtersList.length !== 0) {
      filteredList = filteredList.filter((marker) => {
        return filtersList.every((selectedTag) =>
          marker.tags.includes(selectedTag)
        );
      });
    }

    // sort markers by X value for clustering
    filteredList = filteredList.sort((a, b) => {
      return a.x - b.x;
    });

    let clusters = getClustersFromMarkers(filteredList);

    this.setState({
      selectedCluster: null,
      enabledMarkers: filteredList, // markers that are not hidden
      clusters: clusters, // markers that are shown on map
      loadingText: "",
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
          agent: getAgentFromId(cluster["agent"]),
          ability: getAbilityFromId(cluster["agent"], cluster["ability"]),
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
          onClick={() =>
            this.updateActiveMarker(this.getMarkerFromId(point["id"]))
          }
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
        mapArrows: [],
      },
      this.updateMap
    );
  };

  clearHiddenMarkers = () => {
    this.setState(
      {
        hiddenMarkers: [],
        mapArrows: [],
      },
      this.updateMap
    );
    localStorage.removeItem("hiddenMarkers");
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
              value={this.state.agent}
              label="Agent select"
              placeholder="Agent..."
              options={AGENT_LIST}
              styles={this.customStyles}
              onChange={this.onAgentChange}
            />
            <Select
              value={this.state.ability}
              label="Ability select"
              placeholder="Ability..."
              options={
                this.state.agent !== null
                  ? ABILITY_LIST[this.state.agent.value]
                  : []
              }
              styles={this.customStyles}
              onChange={this.onAbilityChange}
            />
            <MultiSelect
              className="lineup-filter-multi-select"
              options={TAG_LIST}
              value={this.state.filters}
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
            minScale={0.5}
          >
            <div id="lineup-site-map">
              <Map
                rotation={this.state.mapRotation}
                map={this.state.map}
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
