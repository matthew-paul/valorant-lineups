import React, { useState } from "react";
import ImageFrame from "./ImageFrame";
import YoutubeEmbed from "./YoutubeEmbed";
import PropTypes from "prop-types";
import { MdOutlineFeedback } from "react-icons/md";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import EmailForm from "./EmailForm";

const ContentFrame = (props) => {
  const [modalOpen, setModalOpen] = useState(false);

  const updateHiddenProp = (e) => {
    if (e.target.checked) {
      // add marker id to hidden marker list if not already in it - should not be in it anyways
      if (!props.hiddenMarkers.includes(props.activeMarkerId)) {
        props.hiddenMarkers.push(props.activeMarkerId);
      }
    } else {
      let index = props.hiddenMarkers.indexOf(props.activeMarkerId);
      if (index > -1) {
        props.hiddenMarkers.splice(index, 1);
      }
    }

    // update map, which will hide the marker
    props.updateParentState({
      hiddenMarkers: props.hiddenMarkers,
    });

    localStorage.setItem("hiddenMarkers", JSON.stringify(props.hiddenMarkers));
  };

  return (
    <div id="content-frame" className="content-frame">
      {props.name !== "" ? (
        <div>
          <h1 id="content-frame-title">{props.name}</h1>
          <Popup
            open={modalOpen}
            position="right center"
            closeOnDocumentClick
            onClose={() => setModalOpen(false)}
          >
            <EmailForm
              setModalOpen={setModalOpen}
              lineupId={props.activeMarkerId}
            />
          </Popup>
          <MdOutlineFeedback
            id="feedback-icon"
            onClick={() => setModalOpen(true)}
          />
        </div>
      ) : (
        <h1 id="content-frame-title">Click a lineup icon to view info</h1>
      )}
      {props.description !== "" && (
        <h2 id="content-frame-description">{props.description}</h2>
      )}
      {props.credits !== "" && (
        <div id="content-frame-credits-frame">
          <h4 id="content-frame-credits-title">Credits: </h4>
          <h4 id="content-frame-credits">{props.credits}</h4>
        </div>
      )}
      {props.activeMarkerId !== null && (
        <div className="checkbox-outer-container">
          <label className="checkbox-container">
            <input
              id="content-frame-checkbox"
              type="checkbox"
              checked={props.hiddenMarkers.includes(props.activeMarkerId)}
              onChange={updateHiddenProp}
            />
            Hide this lineup
          </label>
        </div>
      )}
      {props.video !== "" && (
        <div id="video-frame">
          <YoutubeEmbed embedId={props.video} />
        </div>
      )}
      {props.images.map((image, index) => (
        <ImageFrame key={index} image={image} />
      ))}
    </div>
  );
};

ContentFrame.propTypes = {
  name: PropTypes.string,
  images: PropTypes.array,
  video: PropTypes.string,
};

ContentFrame.defaultProps = {
  name: "",
  images: [],
  video: "",
};

export default ContentFrame;
