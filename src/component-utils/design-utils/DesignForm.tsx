import React, { Component } from "react";
import type { LineupFormValues } from "../../types/lineup";
import BaseForm, { type LineupFormStateUpdate } from "./BaseForm";

export interface DesignFormProps {
  updateState: LineupFormStateUpdate;
  onSubmit: (event: React.MouseEvent<HTMLButtonElement>) => void;
  state: LineupFormValues;
  disabled?: boolean;
}

export class DesignForm extends Component<DesignFormProps> {
  render() {
    return (
      <div className="design-form-container">
        <BaseForm
          updateState={this.props.updateState}
          state={this.props.state}
          disabled={this.props.disabled}
        />
        <div className="row">
          <button
            type="button"
            className="submit-button"
            disabled={this.props.disabled}
            onClick={this.props.onSubmit}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }
}

export default DesignForm;
