import React, { Component } from "react";
import { MultiSelect } from "react-multi-select-component";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import { WithContext as ReactTags } from "react-tag-input";
import { ABILITY_LIST, AGENT_LIST, TAG_LIST } from "../constants";
import type {
  AbilityOption,
  AgentOption,
  ImageTag,
  LineupFormValues,
  TagOption,
} from "../../types/lineup";

export type LineupFormStateUpdate = (
  values: Partial<LineupFormValues>,
  callback?: () => void
) => void;

export interface BaseFormProps {
  updateState: LineupFormStateUpdate;
  state: LineupFormValues;
  disabled?: boolean;
}

function createSelectStyles<Option>(): StylesConfig<Option, false> {
  return {
    container: (styles) => ({
      ...styles,
      width: "100%",
      height: "45px",
      padding: "0px 5px",
      marginBottom: "5px",
    }),
    control: (styles) => ({
      ...styles,
      height: "100%",
    }),
  };
}

const agentSelectStyles = createSelectStyles<AgentOption>();
const abilitySelectStyles = createSelectStyles<AbilityOption>();

export class BaseForm extends Component<BaseFormProps> {
  handleImageDelete = (indexToDelete: number): void => {
    const { images } = this.props.state;
    this.props.updateState({
      images: images.filter((_, index) => index !== indexToDelete),
    });
  };

  handleImageAdd = (image: ImageTag): void => {
    const urls = new Set(this.props.state.images.map((item) => item.text));
    const images = image.text.split(",").flatMap((input) => {
      const url = input.trim();
      if (url === "" || urls.has(url)) return [];
      urls.add(url);
      return [{ id: url, text: url }];
    });
    this.props.updateState({
      images: [...this.props.state.images, ...images],
    });
  };

  render() {
    const { state, updateState, disabled = false } = this.props;
    const abilityOptions =
      state.agent === null
        ? []
        : ABILITY_LIST[state.agent.value] ?? [];

    return (
      <fieldset
        disabled={disabled}
        style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
      >
        {state.infoMessage.value !== "" ? (
          <div className="row">
            <h2 role="status" className={`info-box ${state.infoMessage.type}`}>
              {state.infoMessage.value}
            </h2>
          </div>
        ) : null}

        <div className="row">
          <input
            className="design-label"
            name="name"
            aria-label="Lineup title"
            placeholder="Lineup Title"
            value={state.name}
            autoComplete="off"
            autoFocus
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updateState({ name: event.target.value });
            }}
          />
        </div>

        <div className="row">
          <textarea
            className="description"
            name="description"
            aria-label="Lineup description"
            placeholder="Lineup Description"
            value={state.description}
            autoComplete="off"
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
              updateState({ description: event.target.value });
            }}
          />
        </div>

        <Select<AgentOption, false>
          aria-label="Agent select"
          isDisabled={disabled}
          placeholder="Agent..."
          value={state.agent}
          options={AGENT_LIST}
          styles={agentSelectStyles}
          onChange={(agent: SingleValue<AgentOption>) => {
            updateState({ agent, ability: null });
          }}
        />

        <Select<AbilityOption, false>
          aria-label="Ability select"
          isDisabled={disabled}
          value={state.ability}
          placeholder="Ability..."
          options={abilityOptions}
          styles={abilitySelectStyles}
          onChange={(ability: SingleValue<AbilityOption>) => {
            updateState({ ability });
          }}
        />

        <div className="row">
          <span id="lineup-form-tags-label" hidden>Select lineup tags</span>
          <MultiSelect
            className="multi-select"
            options={TAG_LIST}
            value={state.tags}
            labelledBy="lineup-form-tags-label"
            disabled={disabled}
            hasSelectAll={false}
            disableSearch={false}
            overrideStrings={{ selectSomeItems: "Select Tags..." }}
            onChange={(tags: TagOption[]) => {
              updateState({ tags });
            }}
          />
        </div>

        <div className="row">
          <ReactTags
            placeholder="Image links (optional), then press enter"
            tags={state.images}
            handleDelete={this.handleImageDelete}
            handleAddition={this.handleImageAdd}
            allowDragDrop={false}
            inputFieldPosition="top"
            allowDeleteFromEmptyInput
            readOnly={disabled}
          />
        </div>

        <div className="row">
          <input
            className="design-label"
            name="video"
            placeholder="YouTube video ID or URL"
            aria-label="YouTube video ID or URL"
            value={state.video}
            autoComplete="off"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updateState({ video: event.target.value });
            }}
          />
        </div>

        <div className="row">
          <input
            className="design-label"
            name="credits"
            aria-label="Credits"
            placeholder="Credits"
            value={state.credits}
            autoComplete="off"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updateState({ credits: event.target.value });
            }}
          />
        </div>

        <div className="row">
          <input
            className="design-label"
            name="apiKey"
            type="password"
            aria-label="API key"
            placeholder="API key"
            value={state.apiKey}
            autoComplete="off"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              updateState({ apiKey: event.target.value });
            }}
          />
        </div>
      </fieldset>
    );
  }
}

export default BaseForm;
