import React, { Component } from "react";
import { MultiSelect } from "react-multi-select-component";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import { GrRotateLeft, GrRotateRight } from "react-icons/gr";
import type { NavigateFunction, Params } from "react-router-dom";

import {
  getMapFromId,
  getAgentFromId,
  getAbilityFromId,
  localStorageExpirationTime,
  MAP_LIST,
  TAG_LIST,
  ABILITY_LIST,
  AGENT_LIST,
} from "../component-utils/constants";
import ContentFrame from "../component-utils/lineup-site-utils/ContentFrame";
import MapInteractionCSS from "../component-utils/map-utils/MapInteractionCSS";
import Map from "../component-utils/map-utils/Map";
import Marker from "../component-utils/map-utils/Marker";
import StartMarker from "../component-utils/map-utils/StartMarker";
import { withRouter } from "../component-utils/withRouter";
import {
  arrowsForCluster,
  clusterLineups,
  filterLineups,
  findLineupById,
  loadLineups,
  parseHiddenMarkerIds,
  readStorageItem,
  removeStorageItem,
} from "../services/lineup-data";
import type {
  AbilityOption,
  AgentOption,
  LineupCluster,
  LineupRecord,
  LineupsByMap,
  MapArrow,
  MapOption,
  MapTransform,
  SelectOption,
  TagOption,
} from "../types/lineup";

export interface LineupSiteProps {
  navigate: NavigateFunction;
  params: Readonly<Params<string>>;
}

interface LineupSiteState {
  loading: boolean;
  error: string | null;
  savedLineups: LineupsByMap;
  allLineups: LineupRecord[];
  enabledMarkers: LineupRecord[];
  hiddenMarkers: string[];
  map: MapOption;
  mapRotation: number;
  agent: AgentOption | null;
  ability: AbilityOption | null;
  filters: TagOption[];
  activeMarkerId: string | null;
  lineupTags: number[];
  name: string;
  description: string;
  credits: string;
  video: string;
  images: string[];
  defaultMapValue: MapTransform;
  markerScale: number;
  clusters: LineupCluster[];
  mapArrows: MapArrow[];
  selectedCluster: LineupCluster | null;
}

const DEFAULT_MAP =
  MAP_LIST.find((map) => map.value === 1) ?? MAP_LIST[0];
const DEFAULT_AGENT =
  AGENT_LIST.find((agent) => agent.value === 13) ?? AGENT_LIST[0];

const emptyDetails = {
  activeMarkerId: null,
  lineupTags: [] as number[],
  name: "",
  description: "",
  credits: "",
  video: "",
  images: [] as string[],
};

export class LineupSite extends Component<LineupSiteProps, LineupSiteState> {
  private loadRequest = 0;

  private readonly customStyles = <
    Option extends SelectOption,
  >(): StylesConfig<Option, false> => ({
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
  });

  state: LineupSiteState = {
    loading: true,
    error: null,
    savedLineups: {},
    allLineups: [],
    enabledMarkers: [],
    hiddenMarkers: [],
    map: DEFAULT_MAP,
    mapRotation: 0,
    agent: DEFAULT_AGENT,
    ability: null,
    filters: [],
    ...emptyDetails,
    defaultMapValue: { scale: 0.85, translation: { x: 0, y: 10 } },
    markerScale: 1,
    clusters: [],
    mapArrows: [],
    selectedCluster: null,
  };

  async componentDidMount(): Promise<void> {
    const request = ++this.loadRequest;
    document.title = "View Lineups";

    const hiddenMarkers = parseHiddenMarkerIds(
      readStorageItem("hiddenMarkers")
    );
    this.setState({ hiddenMarkers });

    try {
      const loaded = await loadLineups({
        expirationMs: localStorageExpirationTime,
      });
      if (request !== this.loadRequest) return;
      this.setState(
        {
          savedLineups: loaded.byMap,
          allLineups: loaded.all,
          loading: false,
          error: null,
        },
        () => this.syncSelectionWithUrl()
      );
    } catch (error) {
      if (request !== this.loadRequest) return;
      const message =
        error instanceof Error ? error.message : "Unable to load lineups";
      this.setState({ loading: false, error: message });
    }
  }

  componentWillUnmount(): void {
    this.loadRequest += 1;
  }

  componentDidUpdate(previousProps: LineupSiteProps): void {
    if (previousProps.params.lineupId !== this.props.params.lineupId) {
      this.syncSelectionWithUrl();
    }
  }

  private syncSelectionWithUrl = (): void => {
    const lineupId = this.props.params.lineupId;
    if (lineupId === undefined) {
      this.setState(
        {
          ...emptyDetails,
          selectedCluster: null,
          mapArrows: [],
          error: null,
        },
        this.updateMap
      );
      return;
    }

    const lineup = findLineupById(this.state.allLineups, lineupId);
    if (lineup === undefined) {
      this.setState(
        {
          ...emptyDetails,
          selectedCluster: null,
          mapArrows: [],
          error: null,
        },
        this.updateMap
      );
      return;
    }

    const map = getMapFromId(lineup.mapId);
    const agent = getAgentFromId(lineup.agent);
    if (map === undefined || agent === undefined) {
      this.setState({
        ...emptyDetails,
        selectedCluster: null,
        mapArrows: [],
        loading: false,
        error: `Lineup ${lineup.id} references an unsupported map or agent`,
      });
      return;
    }

    const alreadyVisible = this.state.enabledMarkers.some(
      (marker) => marker.id === lineup.id
    );
    this.setState(
      {
        activeMarkerId: lineup.id,
        name: lineup.name,
        lineupTags: lineup.tags,
        description: lineup.description,
        credits: lineup.credits,
        video: lineup.video,
        images: lineup.images,
        map,
        agent,
        ability: alreadyVisible ? this.state.ability : null,
        filters: alreadyVisible ? this.state.filters : [],
        mapArrows: [
          {
            x: lineup.x + 13,
            y: lineup.y + 13,
            startX: lineup.startX + 13,
            startY: lineup.startY + 13,
          },
        ],
        error: null,
      },
      this.updateMap
    );
  };

  private getMarkerFromId = (id: string): LineupRecord | undefined =>
    this.state.enabledMarkers.find((marker) => marker.id === id);

  private onClusterHover = (cluster: LineupCluster): void => {
    const pinnedArrows =
      this.state.selectedCluster === null
        ? []
        : arrowsForCluster(this.state.selectedCluster);
    this.setState({
      mapArrows:
        cluster === this.state.selectedCluster
          ? pinnedArrows
          : [...pinnedArrows, ...arrowsForCluster(cluster)],
    });
  };

  private onClusterOut = (): void => {
    this.setState({
      mapArrows:
        this.state.selectedCluster === null
          ? []
          : arrowsForCluster(this.state.selectedCluster),
    });
  };

  private onClusterClick = (cluster: LineupCluster): void => {
    this.setState({
      selectedCluster: cluster,
      mapArrows: arrowsForCluster(cluster),
    });

    if (cluster.points.length === 1) {
      const marker = this.getMarkerFromId(cluster.points[0].id);
      if (marker !== undefined) this.updateActiveMarker(marker);
    }
  };

  private updateActiveMarker = (marker: LineupRecord): void => {
    this.props.navigate(`/${encodeURIComponent(marker.id)}`);
    this.setState({
      activeMarkerId: marker.id,
      name: marker.name,
      lineupTags: marker.tags,
      description: marker.description,
      images: marker.images,
      video: marker.video,
      credits: marker.credits,
    });
  };

  private onMapChange = (map: SingleValue<MapOption>): void => {
    if (map === null || map.value === this.state.map.value) return;

    this.props.navigate("/");
    this.setState(
      {
        map,
        clusters: [],
        mapArrows: [],
        selectedCluster: null,
        enabledMarkers: [],
        filters: [],
        ...emptyDetails,
      },
      this.updateMap
    );
  };

  private onAgentChange = (agent: SingleValue<AgentOption>): void => {
    this.setState(
      {
        clusters: [],
        agent,
        ability: null,
        selectedCluster: null,
        mapArrows: [],
      },
      this.updateMap
    );
  };

  private onAbilityChange = (
    ability: SingleValue<AbilityOption>
  ): void => {
    this.setState({ ability, mapArrows: [] }, this.updateMap);
  };

  private onTagChange = (filters: TagOption[]): void => {
    this.setState({ mapArrows: [], filters }, this.updateMap);
  };

  private updateMap = (): void => {
    const { agent, map, savedLineups } = this.state;
    if (agent === null) {
      this.setState({
        enabledMarkers: [],
        clusters: [],
        selectedCluster: null,
        mapArrows: [],
      });
      return;
    }

    const mapLineups = savedLineups[map.value] ?? [];
    const enabledMarkers = filterLineups(mapLineups, {
      agentId: agent.value,
      abilityId: this.state.ability?.value ?? null,
      tagIds: this.state.filters.map((tag) => tag.value),
      hiddenMarkerIds: this.state.hiddenMarkers,
    });

    const clusters = clusterLineups(enabledMarkers);
    const selectedCluster =
      clusters.find((cluster) =>
        cluster.points.some((point) => point.id === this.state.activeMarkerId)
      ) ?? null;

    this.setState({
      selectedCluster,
      enabledMarkers,
      clusters,
      mapArrows:
        selectedCluster === null ? [] : arrowsForCluster(selectedCluster),
    });
  };

  private getClusters = (): React.ReactNode =>
    this.state.clusters.map((cluster) => {
      const agent = getAgentFromId(cluster.agent);
      const ability = getAbilityFromId(cluster.agent, cluster.ability);
      if (agent === undefined || ability === undefined) return null;

      return (
        <Marker
          key={cluster.points[0].id}
          lineup={{
            agent,
            ability,
            x: cluster.center.x,
            y: cluster.center.y,
          }}
          onHover={() => this.onClusterHover(cluster)}
          onLeave={this.onClusterOut}
          onClick={() => this.onClusterClick(cluster)}
          rotation={this.state.mapRotation}
          scale={this.state.markerScale}
        />
      );
    });

  private getLineupMarkers = (
    cluster: LineupCluster | null
  ): React.ReactNode => {
    if (cluster === null || cluster.points.length === 1) return null;

    return cluster.points.map((point) => (
      <StartMarker
        key={point.id}
        x={point.startX}
        y={point.startY}
        scale={this.state.markerScale}
        rotation={this.state.mapRotation}
        onClick={() => {
          const marker = this.getMarkerFromId(point.id);
          if (marker !== undefined) this.updateActiveMarker(marker);
        }}
      />
    ));
  };

  private updateScale = (scale: number): void => {
    if (scale !== this.state.markerScale) {
      this.setState({ markerScale: scale });
    }
  };

  private updateLineupState = (
    newState: Pick<LineupSiteState, "hiddenMarkers">
  ): void => {
    this.setState(newState, this.updateMap);
  };

  private clearHiddenMarkers = (): void => {
    removeStorageItem("hiddenMarkers");
    this.setState(
      { hiddenMarkers: [], mapArrows: [] },
      this.updateMap
    );
  };

  private rotateMapLeft = (): void => {
    this.setState(({ mapRotation }) => ({
      mapRotation: mapRotation === 0 ? 270 : mapRotation - 90,
    }));
  };

  private rotateMapRight = (): void => {
    this.setState(({ mapRotation }) => ({
      mapRotation: mapRotation === 270 ? 0 : mapRotation + 90,
    }));
  };

  render(): React.ReactNode {
    const abilityOptions =
      this.state.agent === null
        ? []
        : ABILITY_LIST[this.state.agent.value] ?? [];

    return (
      <div className="outer-frame">
        <div className="map-frame">
          <div className="filters-frame">
            <Select<MapOption>
              aria-label="Map select"
              value={this.state.map}
              options={MAP_LIST}
              styles={this.customStyles<MapOption>()}
              onChange={this.onMapChange}
            />
            <Select<AgentOption>
              value={this.state.agent}
              aria-label="Agent select"
              placeholder="Agent..."
              options={AGENT_LIST}
              styles={this.customStyles<AgentOption>()}
              onChange={this.onAgentChange}
            />
            <Select<AbilityOption>
              value={this.state.ability}
              aria-label="Ability select"
              placeholder="Ability..."
              options={abilityOptions}
              styles={this.customStyles<AbilityOption>()}
              onChange={this.onAbilityChange}
            />
            <span id="lineup-filter-tags-label" hidden>Select lineup tags</span>
            <MultiSelect
              className="lineup-filter-multi-select"
              options={TAG_LIST}
              value={this.state.filters}
              labelledBy="lineup-filter-tags-label"
              hasSelectAll={false}
              disableSearch={false}
              overrideStrings={{ selectSomeItems: "Filters..." }}
              onChange={this.onTagChange}
            />
          </div>
          {this.state.hiddenMarkers.length > 0 && (
            <button
              id="clear-hidden-markers-button"
              onClick={this.clearHiddenMarkers}
            >
              Clear hidden lineups
            </button>
          )}
          <div className="rotate-button-container">
            <button
              aria-label="Rotate map left"
              className="rotate-map-button"
              onClick={this.rotateMapLeft}
            >
              <GrRotateLeft />
            </button>
            <button
              aria-label="Rotate map right"
              className="rotate-map-button"
              onClick={this.rotateMapRight}
            >
              <GrRotateRight />
            </button>
          </div>
          {(this.state.loading || this.state.error !== null) && (
            <div className="map-info-text-container">
              <div className="map-info-text">
                {this.state.error ?? "loading lineups..."}
              </div>
            </div>
          )}
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
              />

              {this.state.mapArrows.map((arrow, index) => (
                <svg
                  key={`${index}-${arrow.x}-${arrow.startX}`}
                  width="1000"
                  height="1000"
                  style={{
                    transform: `rotate(${this.state.mapRotation}deg)`,
                    position: "fixed",
                  }}
                >
                  <line
                    data-testid="lineup-arrow"
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
                style={{
                  transform: `rotate(${this.state.mapRotation}deg)`,
                }}
              >
                {this.getClusters()}
                {this.getLineupMarkers(this.state.selectedCluster)}
              </div>
            </div>
          </MapInteractionCSS>
        </div>

        <ContentFrame
          updateParentState={this.updateLineupState}
          activeMarkerId={this.state.activeMarkerId}
          hiddenMarkers={this.state.hiddenMarkers}
          name={this.state.name}
          tags={this.state.lineupTags}
          description={this.state.description}
          credits={this.state.credits}
          video={this.state.video}
          images={this.state.images}
        />
      </div>
    );
  }
}

export default withRouter(LineupSite);
