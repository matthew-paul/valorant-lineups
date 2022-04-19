// @ts-nocheck
import React, { Component } from "react";
import * as CONSTANTS from "../constants";
import { MultiSelect } from "react-multi-select-component";
import PropTypes from "prop-types";

import { WithContext as ReactTags } from "react-tag-input";
import Select from "react-select";

export class Form extends Component {
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

  state = {
    id: null, // id does not change for editing or deleting lineups
    newName: "",
    newDescription: "",
    newAgent: 0, // agent list starts at 1
    newAbility: 0, // ability list starts at 1
    newMapId: 1, // map list starts at 1
    newTags: [],
    newImages: [],
    newVideo: "",
    newCredits: "",
    abilityList: [],
    apiKey: "",
    confirmDeleteActive: false,
  };

  constructor(props) {
    super(props);

    // add agents from file
    this.handleImageDelete = this.handleImageDelete.bind(this);
    this.handleImageAdd = this.handleImageAdd.bind(this);
  }

  componentDidUpdate() {
    if (this.props.state.id !== null && this.state.id !== this.props.state.id) {
      this.setState(
        {
          id: this.props.state.id,
          newName: this.props.state.newName,
          newDescription: this.props.state.newDescription,
          newAgent: this.props.state.newAgent,
          newAbility: this.props.state.newAbility,
          abilityList: CONSTANTS.ABILITY_LIST[this.props.state.newAgent.value],
          newTags: this.props.state.newTags,
          newImages: this.props.state.newImages,
          newVideo: this.props.state.newVideo,
          newCredits: this.props.state.newCredits,
          newMapId: this.props.state.newMapId,
        },
        () => {
          console.log(this.state);
        }
      );
    }
  }

  updateChildAndParent = (values) => {
    this.setState(values);
    this.props.updateParent(values);
  };

  onTagChange = (tagList) => {
    this.updateChildAndParent({
      newTags: tagList,
    });
  };

  updateState = (e) => {
    this.updateChildAndParent({
      [e.target.name]: e.target.value,
    });
  };

  onAgentChange = (agent) => {
    // update agent, then get and update abilities for that agent
    this.setState({
      newAgent: agent,
      newAbility: 0,
      abilityList: CONSTANTS.ABILITY_LIST[agent.value],
    });
    this.props.updateParent({
      newAgent: agent,
      newAbility: 0,
    });
  };

  onAbilityChange = (ability) => {
    // update agent, then get and update abilities for that agent
    this.updateChildAndParent({
      newAbility: ability,
    });
  };

  handleImageDelete = (i) => {
    const { newImages: images } = this.state;
    this.updateChildAndParent({
      newImages: images.filter((tag, index) => index !== i),
    });
  };

  handleImageAdd = (image) => {
    this.updateChildAndParent({
      newImages: [...this.state.newImages, image],
    });
  };

  onKeyPress = (event) => {
    // problem with react tag when pressing enter in video input
    if (event.key === "Enter") {
      event.preventDefault();
      // allow submit from last input
      if (event.target.name === "apiKey") {
        this.props.onSubmit(event);
      }
    }
  };

  render() {
    return (
      <form className="lineup-form">
        <>
          {/* Info Message */}
          {this.props.infoMessage.value !== "" ? (
            <div className="row">
              <h2 className={"info-box " + this.props.infoMessage.type}>
                {this.props.infoMessage.value}
              </h2>
            </div>
          ) : (
            ""
          )}

          {/* Lineup Title */}
          <div className="row">
            <input
              className="design-label"
              name="newName"
              placeholder="Lineup Title"
              value={this.state.newName}
              onChange={(e) => this.updateState(e)}
              autoComplete="off"
              onKeyDown={this.onKeyPress}
              autoFocus
            />
          </div>
          {/* Description */}
          <div className="row">
            <textarea
              className="description"
              name="newDescription"
              placeholder="Lineup Description"
              value={this.state.newDescription}
              onChange={(e) => this.updateState(e)}
              autoComplete="off"
              onKeyDown={this.onKeyPress}
            />
          </div>
          {/* Agent */}
          <Select
            label="Agent select"
            placeholder="Agent..."
            value={this.state.newAgent}
            options={CONSTANTS.AGENT_LIST}
            styles={this.customStyles}
            onChange={this.onAgentChange}
          />
          {/* Ability */}
          <Select
            label="Ability select"
            value={this.state.newAbility}
            placeholder="Ability..."
            options={this.state.abilityList}
            styles={this.customStyles}
            onChange={this.onAbilityChange}
          />
          {/* Tags */}
          <div className="row">
            <MultiSelect
              className="multi-select"
              options={CONSTANTS.TAG_LIST}
              value={this.state.newTags}
              onChange={this.onTagChange}
              labelledBy="Select"
              hasSelectAll={false}
              disableSearch={false}
              overrideStrings={{ selectSomeItems: "Select Tags..." }}
            />
          </div>
          {/* Images */}
          <div className="row">
            <ReactTags
              placeholder="Add image link(s) and press enter"
              tags={this.state.newImages}
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
              name="newVideo"
              placeholder="Youtube embed ID"
              value={this.state.newVideo}
              onChange={(e) => this.updateState(e)}
              autoComplete="off"
              onKeyDown={this.onKeyPress}
            />
          </div>
          {/* Credits */}
          <div className="row">
            <input
              className="design-label"
              name="newCredits"
              placeholder="Credits"
              value={this.state.newCredits}
              onChange={(e) => this.updateState(e)}
              autoComplete="off"
              onKeyDown={this.onKeyPress}
            />
          </div>
          {/* Api Key */}
          <div className="row">
            <input
              className="design-label"
              name="apiKey"
              placeholder="Api Key"
              value={this.state.apiKey}
              onChange={(e) => this.updateState(e)}
              autoComplete="off"
              onKeyDown={this.onKeyPress}
            />
          </div>
          {/* Submit Button */}
          <div className="row">
            <button
              className="submit-button"
              onClick={(e) => this.props.onSubmit(e, "edit")}
            >
              Update
            </button>
          </div>

          {/* Delete Button */}
          <div className="row">
            <button
              className="delete-button"
              onClick={(e) => {
                e.preventDefault();
                this.setState({ confirmDeleteActive: true });
              }}
            >
              Delete
            </button>
            {this.state.confirmDeleteActive ? (
              <div className="confirm-container">
                <button
                  className="confirm-button"
                  onClick={(e) => {
                    this.setState({ confirmDeleteActive: false });
                    this.props.onSubmit(e, "delete");
                  }}
                >
                  Yes
                </button>
                <button
                  className="confirm-button"
                  onClick={(e) => {
                    e.preventDefault();
                    this.setState({ confirmDeleteActive: false });
                  }}
                >
                  No
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        </>
      </form>
    );
  }
}

Form.propTypes = {
  updateParent: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  marker: PropTypes.object,
  infoMessage: PropTypes.object,
};

export default Form;
