// @ts-nocheck
import React, { Component } from "react";
import PropTypes from "prop-types";
import BaseForm from "../design-utils/BaseForm";

export class EditForm extends Component {
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
    confirmDeleteActive: false,
  };

  render() {
    return (
      <div className="edit-form-container">
        <BaseForm
          updateState={this.props.updateState}
          onSubmit={this.props.onSubmit}
          state={this.props.state}
        />
        {/* Update Button */}
        <div className="row">
          <button
            className="submit-button"
            onClick={(e) => {
              this.props.onSubmit(e, "edit");
            }}
          >
            Update
          </button>
        </div>
        {/* Delete Button */}
        <div className="row">
          <button
            className="delete-button"
            onClick={(e) => {
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
      </div>
    );
  }
}

EditForm.propTypes = {
  updateState: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
};

export default EditForm;
