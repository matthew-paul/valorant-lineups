import React, { Component } from "react";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import { MAP_LIST } from "../component-utils/constants";
import DesignForm from "../component-utils/design-utils/DesignForm";
import Map from "../component-utils/map-utils/Map";
import MapInteractionCSS from "../component-utils/map-utils/MapInteractionCSS";
import Marker from "../component-utils/map-utils/Marker";
import startIcon from "../resources/start-icon.png";
import {
  buildAddPayload,
  sendLineupMutation,
  validateLineupForm,
} from "../services/lineup-admin";
import { invalidateLineupCache } from "../services/lineup-data";
import { normalizeYouTubeVideo } from "../services/youtube-video";
import type { LineupFormValues, MapOption } from "../types/lineup";

interface DesignLineupState extends LineupFormValues {
  isSubmitting: boolean;
}

const mapSelectStyles: StylesConfig<MapOption, false> = {
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

const createInitialState = (): DesignLineupState => ({
  isSubmitting: false,
  name: "",
  description: "",
  agent: null,
  ability: null,
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
});

export class DesignLineup extends Component<
  Record<string, never>,
  DesignLineupState
> {
  state: DesignLineupState = createInitialState();

  private requestInFlight = false;

  private disposed = false;

  private settingLineupPosition = false;

  private settingStartPosition = false;

  componentDidMount(): void {
    this.disposed = false;
    document.title = "Create Lineup";
  }

  componentWillUnmount(): void {
    this.disposed = true;
  }

  updateState = (
    values: Partial<LineupFormValues>,
    callback?: () => void
  ): void => {
    if (this.requestInFlight) return;
    this.setState(
      (currentState) => ({ ...currentState, ...values }),
      callback
    );
  };

  onMapClick = (event: React.MouseEvent<HTMLImageElement>): void => {
    if (this.requestInFlight) return;
    const x = event.nativeEvent.offsetX - 12.5;
    const y = event.nativeEvent.offsetY - 12.5;

    if (x < 0 || x > 1000 || y < 0 || y > 1000) {
      return;
    }

    if (this.settingLineupPosition) {
      this.setState({ x, y });
    }

    if (this.settingStartPosition) {
      this.setState({ startX: x, startY: y });
    }

    this.settingLineupPosition = false;
    this.settingStartPosition = false;
  };

  sendLineupToDB = async (): Promise<void> => {
    if (this.requestInFlight) return;
    const video = normalizeYouTubeVideo(this.state.video);
    if (video === null) {
      this.setState({
        infoMessage: {
          type: "error",
          value: "Enter a valid YouTube video ID or URL",
        },
      });
      return;
    }

    this.requestInFlight = true;
    this.setState({ isSubmitting: true });
    try {
      const lineupData = buildAddPayload(this.state, video);
      await sendLineupMutation("add", this.state.apiKey, lineupData);
      invalidateLineupCache();
      if (this.disposed) return;
      this.settingLineupPosition = false;
      this.settingStartPosition = false;
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
    } catch (error: unknown) {
      if (this.disposed) return;
      const message = error instanceof Error ? error.message : String(error);
      this.setState({
        infoMessage: {
          type: "error",
          value: `Error sending lineup to database: ${message}`,
        },
      });
    } finally {
      this.requestInFlight = false;
      if (!this.disposed) this.setState({ isSubmitting: false });
    }
  };

  onSubmit = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    if (this.requestInFlight) return;

    const validation = validateLineupForm(this.state);
    if (!validation.valid) {
      this.setState({
        infoMessage: { type: "error", value: validation.message },
      });
      return;
    }

    this.setState({
      infoMessage: { type: "info", value: "Sending..." },
    });
    void this.sendLineupToDB();
  };

  onContextMenu = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  setLineupPositionClicked = (): void => {
    if (this.settingStartPosition) {
      this.settingStartPosition = false;
    }
    this.settingLineupPosition = true;
  };

  setStartPositionClicked = (): void => {
    if (this.settingLineupPosition) {
      this.settingLineupPosition = false;
    }
    this.settingStartPosition = true;
  };

  onMapChange = (map: SingleValue<MapOption>): void => {
    if (
      this.requestInFlight || map === null || map.value === this.state.map.value
    ) {
      return;
    }
    this.settingLineupPosition = false;
    this.settingStartPosition = false;
    this.setState({ map, x: -1, y: -1, startX: -1, startY: -1 });
  };

  updateScale = (_scale: number): void => {};

  render() {
    return (
      <div className="design-outer-frame">
        <h1 className="design-site-header">LINEUP CREATION</h1>
        <div className="design-form-frame">
          <div className="map-and-buttons">
            <div className="map-select-point">
              <Select<MapOption, false>
                aria-label="Map select"
                value={this.state.map}
                options={MAP_LIST}
                styles={mapSelectStyles}
                isClearable={false}
                isDisabled={this.state.isSubmitting}
                onChange={this.onMapChange}
              />
              <button
                type="button"
                className="map-button"
                disabled={this.state.isSubmitting}
                onClick={this.setLineupPositionClicked}
              >
                Set Lineup Position
              </button>
              <button
                type="button"
                className="map-button"
                disabled={this.state.isSubmitting}
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
                    <Marker
                      lineup={this.state}
                      onClick={() => {
                        if (!this.requestInFlight) {
                          this.setState({ x: -1, y: -1 });
                        }
                      }}
                    />
                  ) : null}
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
                        if (!this.requestInFlight) {
                          this.setState({ startX: -1, startY: -1 });
                        }
                      }}
                    />
                  ) : null}
                </div>
              </MapInteractionCSS>
            </div>
          </div>
          <DesignForm
            updateState={this.updateState}
            onSubmit={this.onSubmit}
            state={this.state}
            disabled={this.state.isSubmitting}
          />
        </div>
      </div>
    );
  }
}

export default DesignLineup;
