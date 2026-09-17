import { useEffect, useState } from "react";
import { removeStorageItem } from "../services/lineup-data";

const Info = (): JSX.Element => {
  const [storageMessage, setStorageMessage] = useState("");
  useEffect(() => {
    document.title = "Info";
  }, []);

  const clearLocalStorage = (): void => {
    const results = ["savedLineups", "lastRetrievedTime", "hiddenMarkers", "editMarker"]
      .map((key) => removeStorageItem(key));
    setStorageMessage(results.every(Boolean)
      ? "Saved lineups and preferences cleared"
      : "Unable to clear browser storage");
  };

  return (
    <div className="info-container">
      <h1 className="info-header">Info</h1>
      <button
        id="clear-local-storage"
        aria-label="Clear saved lineups and preferences"
        title="Clear saved lineups and preferences"
        onClick={clearLocalStorage}
      >
        ↻
      </button>
      {storageMessage !== "" && <p role="status" className="info-content">{storageMessage}</p>}
      <p className="info-content">
        This was a side project I created in a few weeks based off{" "}
        <a
          href="https://docs.google.com/presentation/d/1lC66dZQBioIc2E_sOvXS3ZoNykfSPl0Xj5qaDqknwwA/present?slide=id.g8d7eda0435_9_159"
          target="_blank"
          rel="noreferrer noopener"
        >
          this google slides
        </a>
        , which had the same idea, but was not as interactive or manageable. I
        wanted to build a website that could provide an easy way to access
        lineups during a game using an interactive map with filters to quickly
        choose which lineup would be best for the current situation.
      </p>
      <div className="info-content link">
        <a
          href="https://github.com/matthew-paul/valorant-lineups"
          target="_blank"
          rel="noreferrer noopener"
        >
          https://github.com/matthew-paul/valorant-lineups
        </a>
      </div>
      <div className="info-bottom">
        <span>
          'Valorant Lineups' was created under Riot Games' "Legal Jibber Jabber"
          policy using assets owned by Riot Games.
        </span>
        <br />
        <span style={{ textDecoration: "underline" }}>
          Riot Games does not endorse or sponsor this project.
        </span>
      </div>
    </div>
  );
};

export default Info;
