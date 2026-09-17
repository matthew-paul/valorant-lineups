import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";

import ContentFrame from "./ContentFrame";

jest.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("reactjs-popup", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
}));

jest.mock("./EmailForm", () => ({
  __esModule: true,
  default: () => <div data-testid="email-form" />,
}));

jest.mock("./ImageFrame", () => ({
  __esModule: true,
  default: ({ image }: { image: string }) => <img src={image} alt="lineup" />,
}));

describe("ContentFrame", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it("renders lineup content and persists hidden-marker changes", () => {
    const hiddenMarkers: string[] = [];
    const updateParentState = jest.fn();
    const { rerender } = render(
      <ContentFrame
        activeMarkerId="lineup-1"
        hiddenMarkers={hiddenMarkers}
        updateParentState={updateParentState}
        name="A-site recon"
        tags={[1, 9]}
        description="Stand in the corner."
        images={["first.png"]}
      />
    );

    expect(screen.getByRole("heading", { name: "A-site recon" })).toBeVisible();
    expect(screen.getByText("Easy")).toBeVisible();
    expect(screen.getByText("Attacking")).toBeVisible();
    expect(screen.getByRole("img", { name: "lineup" })).toHaveAttribute(
      "src",
      "first.png"
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Hide this lineup" }));

    expect(hiddenMarkers).toEqual([]);
    expect(updateParentState).toHaveBeenLastCalledWith({
      hiddenMarkers: ["lineup-1"],
    });
    expect(JSON.parse(localStorage.getItem("hiddenMarkers") ?? "[]")).toEqual([
      "lineup-1",
    ]);

    rerender(
      <ContentFrame
        activeMarkerId="lineup-1"
        hiddenMarkers={["lineup-1"]}
        updateParentState={updateParentState}
      />
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Hide this lineup" }));

    expect(hiddenMarkers).toEqual([]);
    expect(updateParentState).toHaveBeenLastCalledWith({ hiddenMarkers: [] });
  });

  it("reports success only after the canonical link is copied", async () => {
    let resolveCopy!: () => void;
    const copyPending = new Promise<void>((resolve) => { resolveCopy = resolve; });
    const writeText = jest.fn().mockReturnValue(copyPending);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <ContentFrame
        activeMarkerId="lineup-2"
        hiddenMarkers={[]}
        updateParentState={jest.fn()}
        name="Lineup"
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Copy lineup link" })
    );

    expect(writeText).toHaveBeenCalledWith(
      "https://valorant-lineups.com/lineup-2"
    );
    expect(toast.success).not.toHaveBeenCalled();
    await act(async () => resolveCopy());
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("reports clipboard failures without displaying a success message", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error("Permission denied")) },
    });
    render(<ContentFrame activeMarkerId="lineup-2" hiddenMarkers={[]} updateParentState={jest.fn()} name="Lineup" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy lineup link" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("still updates hidden lineups when browser storage is unavailable", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
    const updateParentState = jest.fn();
    render(<ContentFrame activeMarkerId="lineup-2" hiddenMarkers={[]} updateParentState={updateParentState} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Hide this lineup" }));
    expect(updateParentState).toHaveBeenCalledWith({ hiddenMarkers: ["lineup-2"] });
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("renders only HTTP credit URLs as links and leaves creator names or unsafe URLs as text", () => {
    const props = { hiddenMarkers: [], updateParentState: jest.fn() };
    const { rerender } = render(<ContentFrame {...props} credits="https://example.com/creator" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com/creator");
    // eslint-disable-next-line no-script-url -- regression input must cover unsafe credit URLs.
    const unsafeCredits = "javascript:alert(1)";
    rerender(<ContentFrame {...props} credits={unsafeCredits} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(unsafeCredits)).toBeInTheDocument();
    rerender(<ContentFrame {...props} credits="Creator name" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Creator name")).toBeInTheDocument();
  });
});
