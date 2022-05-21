import React, { useEffect } from "react";

const Info = () => {
  useEffect(() => {
    document.title = "Info";
  }, []);

  return (
    <div className="info-container">
      <h1 className="info-header">Info</h1>

      <div className="info-content">
        <a
          href="https://github.com/matthew-paul/valorant-lineups"
          target="_blank"
          rel="noreferrer noopener"
        >
          https://github.com/matthew-paul/valorant-lineups
        </a>
      </div>

      <div className="info-bottom">
        <text>
          'Valorant Lineups' was created under Riot Games' "Legal Jibber Jabber"
          policy using assets owned by Riot Games.
        </text>
        <br />
        <text style={{ textDecoration: "underline" }}>
          Riot Games does not endorse or sponsor this project.
        </text>
      </div>
    </div>
  );
};

export default Info;
