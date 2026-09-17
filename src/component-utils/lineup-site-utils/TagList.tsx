import { getTagsFromIds } from "../constants";
import type { TagOption } from "../../types/lineup";

export interface TagListProps {
  tags: readonly number[];
}

// Move easy/medium/hard, attacking/defending to the front of the tag list.
export const sortTags = (tags: readonly TagOption[]): TagOption[] => {
  const newTags = [...tags];

  for (let i = 0; i < newTags.length; i++) {
    const tag = newTags[i];
    if (["Attacking", "Defending"].includes(tag.label)) {
      newTags.splice(i, 1);
      newTags.splice(0, 0, tag);
      break;
    }
  }

  for (let i = 0; i < newTags.length; i++) {
    const tag = newTags[i];
    if (["Easy", "Medium", "Hard"].includes(tag.label)) {
      newTags.splice(i, 1);
      newTags.splice(0, 0, tag);
      break;
    }
  }

  return newTags;
};

interface TagItemProps {
  label: string;
}

const TagItem = ({ label }: TagItemProps): JSX.Element => {
  return <div className={`tag ${label.replace(/\s+/g, "")}`}>{label}</div>;
};

const TagList = ({ tags }: TagListProps): JSX.Element => {
  return (
    <div className="lineup-tags-container">
      {sortTags(getTagsFromIds(tags)).map((tag) => (
        <TagItem key={tag.value} label={tag.label} />
      ))}
    </div>
  );
};

export default TagList;
