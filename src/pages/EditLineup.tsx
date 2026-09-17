import React, { Component } from "react";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import {
  MAP_LIST,
  getAbilityFromId,
  getAgentFromId,
  getImagesFromIds,
  getMapFromId,
  getTagsFromIds,
} from "../component-utils/constants";
import EditForm, {
  type EditRequestType,
} from "../component-utils/edit-utils/EditForm";
import Map from "../component-utils/map-utils/Map";
import MapInteractionCSS from "../component-utils/map-utils/MapInteractionCSS";
import Marker from "../component-utils/map-utils/Marker";
import startIcon from "../resources/start-icon.png";
import {
  buildDeletePayload,
  buildEditPayload,
  sendLineupMutation,
  validateLineupForm,
} from "../services/lineup-admin";
import {
  invalidateLineupCache,
  isLineupRecord,
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "../services/lineup-data";
import type {
  LineupFormValues,
  LineupRecord,
  MapOption,
  MapTransform,
} from "../types/lineup";

interface EditLineupState extends LineupFormValues {
  isSubmitting: boolean;
  marker: LineupRecord | null;
  id: string;
  defaultMapValue: MapTransform;
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

const createInitialState = (): EditLineupState => ({
  isSubmitting: false,
  marker: null,
  id: "",
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
  defaultMapValue: { scale: 0.85, translation: { x: 0, y: 0 } },
});

export class EditLineup extends Component<
  Record<string, never>,
  EditLineupState
> {
  state: EditLineupState = createInitialState();

  private requestInFlight = false;

  private disposed = false;

  private settingLineupPosition = false;

  private settingStartPosition = false;

  componentDidMount(): void {
    this.disposed = false;
    document.title = "Edit Lineup";

    const serializedMarker = readStorageItem("editMarker");
    if (serializedMarker === null) {
      this.setState({
        infoMessage: {
          type: "info",
          value: "Choose a lineup on the selection page to edit it",
        },
      });
      return;
    }

    try {
      const parsedMarker: unknown = JSON.parse(serializedMarker);
      if (!isLineupRecord(parsedMarker)) {
        throw new Error("Saved lineup data does not match the expected schema");
      }

      const map = getMapFromId(parsedMarker.mapId);
      const agent = getAgentFromId(parsedMarker.agent);
      const ability = getAbilityFromId(
        parsedMarker.agent,
        parsedMarker.ability
      );
      if (map === undefined || agent === undefined || ability === undefined) {
        throw new Error("Saved lineup references an unsupported map or agent");
      }

      this.setState({
        marker: parsedMarker,
        id: parsedMarker.id,
        name: parsedMarker.name,
        description: parsedMarker.description,
        map,
        agent,
        ability,
        tags: getTagsFromIds(parsedMarker.tags),
        images: getImagesFromIds(parsedMarker.images),
        video: parsedMarker.video,
        credits: parsedMarker.credits,
        x: parsedMarker.x,
        y: parsedMarker.y,
        startX: parsedMarker.startX,
        startY: parsedMarker.startY,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.setState({
        infoMessage: {
          type: "error",
          value: `Unable to load the selected lineup: ${message}`,
        },
      });
    }
  }

  componentWillUnmount(): void {
    this.disposed = true;
  }

  private saveSelection = (marker: LineupRecord | null): void => {
    // Another editor tab may have selected a different record in the meantime.
    const serialized = readStorageItem("editMarker");
    if (serialized === null) return;
    try {
      const selected: unknown = JSON.parse(serialized);
      if (!isLineupRecord(selected) || selected.id !== this.state.id) return;
      if (marker === null) removeStorageItem("editMarker");
      else writeStorageItem("editMarker", JSON.stringify(marker));
    } catch {
      // Editing can continue when browser storage is unavailable or corrupted.
    }
  };

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

  sendUpdateToDB = async (
    requestType: EditRequestType
  ): Promise<void> => {
    if (this.requestInFlight) return;
    if (this.state.marker === null) {
      this.setState({
        infoMessage: {
          type: "error",
          value: "No lineup is selected for editing",
        },
      });
      return;
    }

    this.requestInFlight = true;
    this.setState({ isSubmitting: true });
    try {
      let responseBody: string;
      if (requestType === "delete") {
        responseBody = await sendLineupMutation(
          "delete",
          this.state.apiKey,
          buildDeletePayload(this.state.id, this.state.marker.mapId)
        );
        this.saveSelection(null);
        if (!this.disposed) this.setState(createInitialState());
      } else {
        const lineupData = buildEditPayload(this.state, this.state.id);
        responseBody = await sendLineupMutation(
          "edit", this.state.apiKey, lineupData
        );
        this.saveSelection(lineupData);
        if (!this.disposed) {
          this.setState({ marker: lineupData, video: lineupData.video });
        }
      }
      invalidateLineupCache();
      if (this.disposed) return;
      this.setState({
        infoMessage: {
          type: "success",
          value:
            responseBody === ""
              ? `Lineup ${requestType} request completed`
              : responseBody,
        },
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

  onSubmit = (
    event: React.MouseEvent<HTMLButtonElement>,
    requestType: EditRequestType
  ): void => {
    event.preventDefault();
    if (this.requestInFlight) return;

    if (this.state.marker === null) {
      this.setState({
        infoMessage: {
          type: "error",
          value: "No lineup is selected for editing",
        },
      });
      return;
    }

    if (requestType === "edit") {
      const validation = validateLineupForm(this.state);
      if (!validation.valid) {
        this.setState({
          infoMessage: { type: "error", value: validation.message },
        });
        return;
      }
    } else if (this.state.apiKey.trim() === "") {
      this.setState({
        infoMessage: { type: "error", value: "Enter an API key" },
      });
      return;
    }

    this.setState({
      infoMessage: { type: "info", value: "Sending..." },
    });
    void this.sendUpdateToDB(requestType);
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
        <h1 className="design-site-header">LINEUP EDITING</h1>
        <div className="design-form-frame">
          <div className="map-and-buttons">
            <div className="map-select-point">
              <Select<MapOption, false>
                aria-label="Map select"
                value={this.state.map}
                options={MAP_LIST}
                styles={mapSelectStyles}
                isClearable={false}
                isDisabled={this.state.isSubmitting || this.state.marker === null}
                onChange={this.onMapChange}
              />
              <button
                type="button"
                className="map-button"
                disabled={this.state.isSubmitting || this.state.marker === null}
                onClick={this.setLineupPositionClicked}
              >
                Set Lineup Position
              </button>
              <button
                type="button"
                className="map-button"
                disabled={this.state.isSubmitting || this.state.marker === null}
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
                <Map map={this.state.map} onMapClick={this.onMapClick} />

                <div>
                  {this.state.x !== -1 ? (
                    <Marker
                      lineup={{
                        agent: this.state.agent,
                        ability: this.state.ability,
                        x: this.state.x,
                        y: this.state.y,
                      }}
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
          <EditForm
            updateState={this.updateState}
            onSubmit={this.onSubmit}
            state={this.state}
            disabled={this.state.isSubmitting || this.state.marker === null}
          />
        </div>
      </div>
    );
  }
}

export default EditLineup;
