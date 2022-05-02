import React from "react";
import * as CONSTANTS from "../constants";

const TagList = ({ tags }) => {
  // Move easy/medium/hard, attacking/defending to front of tag list
  const sortItems = (tags) => {
    let newTags = [...tags];

    for (let i = 0; i < newTags.length; i++) {
      let tag = newTags[i];
      if (["Attacking", "Defending"].includes(tag.label)) {
        newTags.splice(i, 1);
        newTags.splice(0, 0, tag);
        break;
      }
    }

    for (let i = 0; i < newTags.length; i++) {
      let tag = newTags[i];
      if (["Easy", "Medium", "Hard"].includes(tag.label)) {
        newTags.splice(i, 1);
        newTags.splice(0, 0, tag);
        break;
      }
    }

    return newTags;
  };

  const TagItem = ({ label }) => {
    return <div className={`tag ${label.replace(/\s+/g, "")}`}>{label}</div>;
  };

  return (
    <div className="lineup-tags-container">
      {sortItems(CONSTANTS.getTagsFromIds(tags)).map((tag) => (
        <TagItem label={tag.label} />
      ))}
    </div>
  );
};

export default TagList;
