// @ts-nocheck
import React, { Component } from "react";
import PropTypes from "prop-types";
import BaseForm from "./BaseForm";

export class DesignForm extends Component {
  resetForm = () => {
    this.props.updateState({
      name: "",
      description: "",
      tags: [],
      images: [],
      video: "",
      credits: "",
    });
  };

  render() {
    return (
      <div className="design-form-container">
        <BaseForm
          updateState={this.props.updateState}
          onSubmit={this.props.onSubmit}
          state={this.props.state}
        />
        {/* Submit Button */}
        <div className="row">
          <button
            className="submit-button"
            onClick={(e) => {
              this.props.onSubmit(e);
              this.resetForm();
            }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }
}

DesignForm.propTypes = {
  updateState: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
};

export default DesignForm;
