import React, { useEffect } from "react";

const Info = () => {
  useEffect(() => {
    document.title = "Info";
  }, []);

  return (
    <div className="info-container">
      <h1 className="info-header">Info</h1>
      <div className="info-content">
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
