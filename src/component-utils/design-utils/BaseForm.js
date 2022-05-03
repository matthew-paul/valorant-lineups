import PropTypes from "prop-types";
import React, { Component } from "react";
import { ABILITY_LIST, AGENT_LIST, TAG_LIST } from "../constants";
import { MultiSelect } from "react-multi-select-component";
import { WithContext as ReactTags } from "react-tag-input";
import Select from "react-select";

export class BaseForm extends Component {
  static propTypes = {
    updateState: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired,
  };

  customStyles = {
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

  constructor(props) {
    super(props);

    // add agents from file
    this.handleImageDelete = this.handleImageDelete.bind(this);
    this.handleImageAdd = this.handleImageAdd.bind(this);
  }

  handleImageDelete = (i) => {
    const { images } = this.props.state;
    this.props.updateState({
      images: images.filter((_, index) => index !== i),
    });
  };

  handleImageAdd = (image) => {
    let images = image.text
      .split(",")
      .map((image) => ({ id: image, text: image }));
    this.props.updateState({
      images: [...this.props.state.images, ...images],
    });
  };

  render() {
    return (
      <div>
        {/* Info Message */}
        {this.props.state.infoMessage.value !== "" ? (
          <div className="row">
            <h2 className={"info-box " + this.props.state.infoMessage.type}>
              {this.props.state.infoMessage.value}
            </h2>
          </div>
        ) : (
          ""
        )}

        {/* Lineup Title */}
        <div className="row">
          <input
            className="design-label"
            name="name"
            placeholder="Lineup Title"
            value={this.props.state.name}
            autoComplete="off"
            autoFocus
            onChange={(e) => {
              this.props.updateState({ name: e.target.value });
            }}
          />
        </div>
        {/* Description */}
        <div className="row">
          <textarea
            className="description"
            name="description"
            placeholder="Lineup Description"
            value={this.props.state.description}
            autoComplete="off"
            onChange={(e) => {
              this.props.updateState({ description: e.target.value });
            }}
          />
        </div>
        {/* Agent */}
        <Select
          placeholder="Agent..."
          value={this.props.state.agent}
          options={AGENT_LIST}
          styles={this.customStyles}
          onChange={(agent) => {
            this.props.updateState({ agent: agent, ability: null });
          }}
        />
        {/* Ability */}
        <Select
          value={this.props.state.ability}
          placeholder="Ability..."
          options={
            this.props.state.agent !== null
              ? ABILITY_LIST[this.props.state.agent.value]
              : []
          }
          styles={this.customStyles}
          onChange={(ability) => {
            this.props.updateState({ ability: ability });
          }}
        />
        {/* Tags */}
        <div className="row">
          <MultiSelect
            className="multi-select"
            options={TAG_LIST}
            value={this.props.state.tags}
            labelledBy="Select"
            hasSelectAll={false}
            disableSearch={false}
            overrideStrings={{ selectSomeItems: "Select Tags..." }}
            onChange={(tags) => {
              this.props.updateState({ tags: tags });
            }}
          />
        </div>
        {/* Images */}
        <div className="row">
          <ReactTags
            placeholder="Add image link(s) and press enter"
            tags={this.props.state.images}
            handleDelete={this.handleImageDelete}
            handleAddition={this.handleImageAdd}
            allowDragDrop={false}
            inputFieldPosition="top"
            allowDeleteFromEmptyInput={true}
          />
        </div>
        {/* Video */}
        <div className="row">
          <input
            className="design-label"
            name="video"
            placeholder="Youtube embed ID"
            value={this.props.state.video}
            autoComplete="off"
            onChange={(e) => {
              this.props.updateState({ video: e.target.value });
            }}
          />
        </div>
        {/* Credits */}
        <div className="row">
          <input
            className="design-label"
            name="credits"
            placeholder="Credits"
            value={this.props.state.credits}
            autoComplete="off"
            onChange={(e) => {
              this.props.updateState({ credits: e.target.value });
            }}
          />
        </div>
        {/* Api Key */}
        <div className="row">
          <input
            className="design-label"
            name="apiKey"
            placeholder="Api Key"
            value={this.props.state.apiKey}
            autoComplete="off"
            onChange={(e) => {
              this.props.updateState({ apiKey: e.target.value });
            }}
          />
        </div>
      </div>
    );
  }
}

export default BaseForm;
