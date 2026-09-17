import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { makeLineup } from "./test-utils/lineup-fixtures";

describe("application routes", () => {
  let fetcher: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetcher.mockResolvedValue({
      ok: true, status: 200,
      json: async () => [makeLineup({ id: "linked-lineup", name: "Linked lineup" })],
    } as Response);
    Object.defineProperty(globalThis, "fetch", {
      configurable: true, writable: true, value: fetcher,
    });
  });

  test.each([
    ["/send", "LINEUP CREATION", "Create Lineup"],
    ["/edit", "LINEUP EDITING", "Edit Lineup"],
    ["/about", "Info", "Info"],
  ])("renders the real %s page", (path, heading, title) => {
    window.history.replaceState({}, "", path);
    render(<App />);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(document.title).toBe(title);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("renders the selection page", async () => {
    window.history.replaceState({}, "", "/select");
    render(<App />);
    await waitFor(() => expect(screen.queryByText(/loading lineups/i)).not.toBeInTheDocument());
    expect(document.title).toBe("Select Lineup to Edit");
    expect(screen.getByLabelText("Map select")).toBeInTheDocument();
  });

  test("opens a lineup from the map and follows browser back and forward", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("img", { name: /ability marker/i }));
    expect(await screen.findByRole("heading", { name: "Linked lineup" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/linked-lineup");
    act(() => window.history.back());
    expect(await screen.findByRole("heading", { name: /click a lineup icon/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
    act(() => window.history.forward());
    expect(await screen.findByRole("heading", { name: "Linked lineup" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/linked-lineup");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("opens a direct lineup link with a single viewer", async () => {
    window.history.replaceState({}, "", "/linked-lineup");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Linked lineup" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Map select")).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
