import React, { Component } from "react";
import type {
  LineupFormValues,
  MutationRequestType,
} from "../../types/lineup";
import BaseForm, {
  type LineupFormStateUpdate,
} from "../design-utils/BaseForm";

export type EditRequestType = Exclude<MutationRequestType, "add">;

export interface EditFormProps {
  updateState: LineupFormStateUpdate;
  onSubmit: (
    event: React.MouseEvent<HTMLButtonElement>,
    requestType: EditRequestType
  ) => void;
  state: LineupFormValues;
  disabled?: boolean;
}

interface EditFormState {
  confirmDeleteActive: boolean;
}

export class EditForm extends Component<EditFormProps, EditFormState> {
  state: EditFormState = {
    confirmDeleteActive: false,
  };

  render() {
    return (
      <div className="edit-form-container">
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
            onClick={(event) => {
              this.props.onSubmit(event, "edit");
            }}
          >
            Update
          </button>
        </div>

        <div className="row">
          <button
            type="button"
            className="delete-button"
            disabled={this.props.disabled}
            onClick={() => {
              this.setState({ confirmDeleteActive: true });
            }}
          >
            Delete
          </button>
          {this.state.confirmDeleteActive ? (
            <div className="confirm-container">
              <button
                type="button"
                className="confirm-button"
                disabled={this.props.disabled}
                onClick={(event) => {
                  this.setState({ confirmDeleteActive: false });
                  this.props.onSubmit(event, "delete");
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="confirm-button"
                disabled={this.props.disabled}
                onClick={() => {
                  this.setState({ confirmDeleteActive: false });
                }}
              >
                No
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default EditForm;
