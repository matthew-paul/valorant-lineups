import { render, screen } from "@testing-library/react";

import TagList, { sortTags } from "./TagList";

describe("TagList", () => {
  it("puts difficulty first and attack/defense second", () => {
    render(<TagList tags={[5, 1, 10, 3]} />);

    expect(
      screen
        .getAllByText(/Medium|Attacking|Post Plant|A Site/)
        .map((element) => element.textContent)
    ).toEqual(["Medium", "Attacking", "Post Plant", "A Site"]);
    expect(screen.getByText("Post Plant")).toHaveClass("PostPlant");
  });

  it("sorts a copy without mutating the supplied tag options", () => {
    const tags = [
      { value: 5, label: "A Site" },
      { value: 1, label: "Attacking" },
      { value: 10, label: "Medium" },
    ];

    expect(sortTags(tags).map(({ label }) => label)).toEqual([
      "Medium",
      "Attacking",
      "A Site",
    ]);
    expect(tags.map(({ label }) => label)).toEqual([
      "A Site",
      "Attacking",
      "Medium",
    ]);
  });
});
