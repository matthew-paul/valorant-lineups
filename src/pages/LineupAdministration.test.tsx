import { act, createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { makeLineup } from "../test-utils/lineup-fixtures";
import DesignLineup from "./DesignLineup";
import EditLineup from "./EditLineup";

const responseWith = (body = "", ok = true): Response => ({
  ok, status: ok ? 200 : 503, text: async () => body,
} as Response);

const choose = (label: string, value: string): void => {
  fireEvent.keyDown(screen.getByLabelText(label), { key: "ArrowDown" });
  fireEvent.click(screen.getByText(value));
};

const positionMarker = (buttonName: string, x: number, y: number): void => {
  fireEvent.click(screen.getByRole("button", { name: buttonName }));
  const map = screen.getByRole("img", { name: /map$/i });
  const event = createEvent.click(map);
  Object.defineProperties(event, {
    offsetX: { value: x + 12.5 },
    offsetY: { value: y + 12.5 },
  });
  fireEvent(map, event);
};

const fillNewLineup = (): void => {
  fireEvent.change(screen.getByLabelText("Lineup title"), { target: { value: "New lineup" } });
  choose("Agent select", "Sova");
  choose("Ability select", "Recon Bolt");
  const imageInput = screen.getByLabelText("Add image link(s) and press enter");
  fireEvent.change(imageInput, { target: { value: " https://example.com/image.jpg, https://example.com/image.jpg, " } });
  fireEvent.keyDown(imageInput, { key: "Enter", keyCode: 13, which: 13 });
  fireEvent.change(screen.getByLabelText("YouTube video ID or URL"), { target: { value: "https://youtu.be/04K6YaRNtE8?t=70" } });
  fireEvent.change(screen.getByLabelText("API key"), { target: { value: "test-key" } });
  positionMarker("Set Lineup Position", 100, 200);
  positionMarker("Set Start Position", 300, 400);
};

describe("lineup administration", () => {
  let fetcher: jest.MockedFunction<typeof fetch>;
  beforeEach(() => {
    localStorage.clear();
    fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    Object.defineProperty(globalThis, "fetch", {
      configurable: true, writable: true, value: fetcher,
    });
  });

  test("submits a normalized create payload once and invalidates cached records", async () => {
    let resolveRequest!: (response: Response) => void;
    fetcher.mockReturnValue(new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    localStorage.setItem("savedLineups", "{}");
    localStorage.setItem("lastRetrievedTime", "123");
    render(<DesignLineup />);
    fillNewLineup();
    const submit = screen.getByRole("button", { name: "Enter" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
    expect(screen.getByLabelText("Lineup title")).toBeDisabled();
    const request = fetcher.mock.calls[0][1];
    expect(request?.headers).toMatchObject({ "request-type": "add", "x-api-key": "test-key" });
    expect(JSON.parse(String(request?.body))).toMatchObject({
      name: "New lineup", video: "04K6YaRNtE8?start=70", agent: 13, ability: 1,
      x: 100, y: 200, startX: 300, startY: 400,
      images: ["https://example.com/image.jpg"],
    });
    await act(async () => resolveRequest(responseWith()));
    expect(screen.getByRole("status")).toHaveTextContent(/sent lineup to database/i);
    expect(screen.getByLabelText("Lineup title")).toHaveValue("");
    expect(submit).toBeEnabled();
    expect(localStorage.getItem("savedLineups")).toBeNull();
    expect(localStorage.getItem("lastRetrievedTime")).toBeNull();
  });

  test("retains the form and permits retry after a rejected create request", async () => {
    fetcher.mockResolvedValue(responseWith("Unavailable", false));
    render(<DesignLineup />);
    fillNewLineup();
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(await screen.findByText(/request failed with status 503/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Lineup title")).toHaveValue("New lineup");
    expect(screen.getByLabelText("YouTube video ID or URL")).toHaveValue("https://youtu.be/04K6YaRNtE8?t=70");
    expect(screen.getByRole("button", { name: "Enter" })).toBeEnabled();
  });

  test("requires new positions after changing a creation map", () => {
    render(<DesignLineup />);
    fillNewLineup();
    choose("Map select", "Ascent");
    expect(screen.queryByRole("img", { name: "start position" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(screen.getByRole("status")).toHaveTextContent(/select a lineup position/i);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("saves an edited selection and deletes it using its updated map ID", async () => {
    const lineup = makeLineup();
    localStorage.setItem("editMarker", JSON.stringify(lineup));
    fetcher.mockResolvedValue(responseWith());
    render(<EditLineup />);
    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "test-key" } });
    fireEvent.change(screen.getByLabelText("Lineup title"), { target: { value: "Edited lineup" } });
    choose("Map select", "Bind");
    positionMarker("Set Lineup Position", 10, 20);
    positionMarker("Set Start Position", 30, 40);
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/edit request completed/i));
    expect(JSON.parse(localStorage.getItem("editMarker") ?? "null")).toMatchObject({ name: "Edited lineup", mapId: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetcher).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(fetcher).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/delete request completed/i));
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({ id: lineup.id, mapId: 2 });
    expect(localStorage.getItem("editMarker")).toBeNull();
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  test("preserves a video timestamp after saving, reopening, and saving an edit again", async () => {
    localStorage.setItem("editMarker", JSON.stringify(makeLineup()));
    fetcher.mockResolvedValue(responseWith());
    const { unmount } = render(<EditLineup />);
    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "test-key" } });
    fireEvent.change(screen.getByLabelText("YouTube video ID or URL"), {
      target: { value: "https://youtu.be/04K6YaRNtE8?t=70" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/edit request completed/i));
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ video: "04K6YaRNtE8?start=70" });
    expect(screen.getByLabelText("YouTube video ID or URL")).toHaveValue("04K6YaRNtE8?start=70");
    expect(JSON.parse(localStorage.getItem("editMarker") ?? "null")).toMatchObject({ video: "04K6YaRNtE8?start=70" });

    unmount();
    render(<EditLineup />);
    expect(screen.getByLabelText("YouTube video ID or URL")).toHaveValue("04K6YaRNtE8?start=70");
    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "test-key" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/edit request completed/i));
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({ video: "04K6YaRNtE8?start=70" });
  });

  test("shows corrupt saved selections without allowing mutations", () => {
    localStorage.setItem("editMarker", "{");
    render(<EditLineup />);
    expect(screen.getByRole("status")).toHaveTextContent(/unable to load the selected lineup/i);
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("a rejected update keeps the original selection and enables retry", async () => {
    const lineup = makeLineup();
    localStorage.setItem("editMarker", JSON.stringify(lineup));
    fetcher.mockResolvedValue(responseWith("Unavailable", false));
    render(<EditLineup />);
    fireEvent.change(screen.getByLabelText("API key"), { target: { value: "test-key" } });
    fireEvent.change(screen.getByLabelText("Lineup title"), { target: { value: "Unsaved changes" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByText(/request failed with status 503/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Lineup title")).toHaveValue("Unsaved changes");
    expect(JSON.parse(localStorage.getItem("editMarker") ?? "null")).toEqual(lineup);
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
  });
});
