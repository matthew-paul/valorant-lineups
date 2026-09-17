import React, { useState } from "react";
import { MdOutlineFeedback, MdOutlineContentCopy } from "react-icons/md";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ImageFrame from "./ImageFrame";
import YoutubeEmbed from "./YoutubeEmbed";
import EmailForm from "./EmailForm";
import TagList from "./TagList";

interface HiddenMarkerStateUpdate {
  hiddenMarkers: string[];
}

export interface ContentFrameProps {
  updateParentState: (state: HiddenMarkerStateUpdate) => void;
  hiddenMarkers: string[];
  activeMarkerId?: string | null;
  name?: string;
  tags?: readonly number[];
  description?: string;
  credits?: string;
  images?: readonly string[];
  video?: string;
}

const ContentFrame = ({
  updateParentState,
  hiddenMarkers,
  activeMarkerId = null,
  name = "",
  tags = [],
  description = "",
  credits = "",
  images = [],
  video = "",
}: ContentFrameProps): JSX.Element => {
  const uniqueToastId = "toast-id"; // prevent duplicate toasts

  const [modalOpen, setModalOpen] = useState(false);
  let creditsUrl: string | undefined;
  try {
    const url = new URL(credits);
    if (url.protocol === "https:" || url.protocol === "http:") {
      creditsUrl = url.href;
    }
  } catch {
    // Credits may also be plain text, such as the creator's display name.
  }

  const updateHiddenProp = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (activeMarkerId === null) {
      return;
    }

    const nextHiddenMarkers = event.target.checked
      ? hiddenMarkers.includes(activeMarkerId)
        ? hiddenMarkers
        : [...hiddenMarkers, activeMarkerId]
      : hiddenMarkers.filter((markerId) => markerId !== activeMarkerId);

    // update map, which will hide the marker
    updateParentState({
      hiddenMarkers: nextHiddenMarkers,
    });

    try {
      localStorage.setItem("hiddenMarkers", JSON.stringify(nextHiddenMarkers));
    } catch {
      toast.error(
        "Your browser could not save this preference. It will apply for this visit.",
        { toastId: uniqueToastId }
      );
    }
  };

  const copyLineupLink = async (): Promise<void> => {
    if (activeMarkerId === null) return;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable");
      }
      await navigator.clipboard.writeText(
        `https://valorant-lineups.com/${encodeURIComponent(activeMarkerId)}`
      );
      toast.success("Copied link to clipboard!", { toastId: uniqueToastId });
    } catch {
      toast.error("Unable to copy the lineup link. Please try again.", {
        toastId: uniqueToastId,
      });
    }
  };

  const copyLineupLinkFromKeyboard = (
    event: React.KeyboardEvent<SVGElement>
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void copyLineupLink();
    }
  };

  return (
    <div id="content-frame" className="content-frame">
      <ToastContainer
        limit={1}
        theme="dark"
        position="bottom-right"
        autoClose={1000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
      />
      <Popup
        open={modalOpen}
        position="right center"
        closeOnDocumentClick
        onClose={() => setModalOpen(false)}
      >
        <EmailForm
          setModalOpen={setModalOpen}
          lineupId={activeMarkerId}
        />
      </Popup>
      <MdOutlineFeedback
        id="feedback-icon"
        aria-label="Send feedback"
        role="button"
        tabIndex={0}
        onClick={() => setModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setModalOpen(true);
          }
        }}
      />
      {name !== "" ? (
        <div id="content-frame-title-container">
          <h1 id="content-frame-title">{name}</h1>
          <MdOutlineContentCopy
            id="copy-link-icon"
            aria-label="Copy lineup link"
            role="button"
            tabIndex={0}
            onClick={copyLineupLink}
            onKeyDown={copyLineupLinkFromKeyboard}
          />
        </div>
      ) : (
        <h1 id="content-frame-title">Click a lineup icon to view info</h1>
      )}
      <TagList tags={tags} />
      {description !== "" && (
        <h2 id="content-frame-description">{description}</h2>
      )}
      {credits !== "" && (
        <div id="content-frame-credits-frame">
          <h4 id="content-frame-credits-title">Credits: </h4>
          {creditsUrl ? (
            <a
              id="content-frame-credits"
              href={creditsUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {credits}
            </a>
          ) : (
            <p id="content-frame-credits">{credits}</p>
          )}
        </div>
      )}
      {activeMarkerId !== null && (
        <div className="checkbox-outer-container">
          <label className="checkbox-container">
            <input
              id="content-frame-checkbox"
              type="checkbox"
              checked={hiddenMarkers.includes(activeMarkerId)}
              onChange={updateHiddenProp}
            />
            Hide this lineup
          </label>
        </div>
      )}
      {video !== "" && (
        <div id="video-frame">
          <YoutubeEmbed embedId={video} />
        </div>
      )}
      {images.map((image, index) => (
        <ImageFrame key={index} image={image} />
      ))}
    </div>
  );
};

export default ContentFrame;
