import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { NavigateFunction } from "react-router-dom";

import { makeLineup } from "../test-utils/lineup-fixtures";
import { LineupSite } from "./LineupSite";

const responseWith = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);

describe("LineupSite", () => {
  const navigate = jest.fn() as jest.MockedFunction<NavigateFunction>;
  let fetcher: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
    fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetcher,
    });
  });

  test("loads and displays a directly linked lineup", async () => {
    const lineup = makeLineup({
      id: "direct-link",
      name: "Direct linked lineup",
      x: 20,
      y: 30,
      startX: 40,
      startY: 50,
    });
    fetcher.mockResolvedValue(responseWith([lineup]));

    render(
      <LineupSite navigate={navigate} params={{ lineupId: lineup.id }} />
    );

    expect(
      await screen.findByRole("heading", { name: lineup.name })
    ).toBeInTheDocument();
    expect(screen.getByText(lineup.description)).toBeInTheDocument();

    const line = screen.getByTestId("lineup-arrow");
    expect(line).toHaveAttribute("x1", "33");
    expect(line).toHaveAttribute("y1", "43");
    expect(line).toHaveAttribute("x2", "53");
    expect(line).toHaveAttribute("y2", "63");
  });

  test("reacts to lineup parameter changes without another request", async () => {
    const first = makeLineup({ id: "first", name: "First lineup" });
    const second = makeLineup({ id: "second", name: "Second lineup" });
    fetcher.mockResolvedValue(responseWith([first, second]));

    const { rerender } = render(
      <LineupSite navigate={navigate} params={{ lineupId: first.id }} />
    );
    expect(
      await screen.findByRole("heading", { name: first.name })
    ).toBeInTheDocument();

    rerender(
      <LineupSite navigate={navigate} params={{ lineupId: second.id }} />
    );
    expect(
      await screen.findByRole("heading", { name: second.name })
    ).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);

    rerender(<LineupSite navigate={navigate} params={{}} />);
    expect(
      await screen.findByRole("heading", {
        name: /click a lineup icon to view info/i,
      })
    ).toBeInTheDocument();
  });

  test("keeps the viewer usable for an unknown deep link", async () => {
    fetcher.mockResolvedValue(responseWith([makeLineup()]));
    render(
      <LineupSite navigate={navigate} params={{ lineupId: "missing" }} />
    );

    await waitFor(() =>
      expect(screen.queryByText(/loading lineups/i)).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("heading", {
        name: /click a lineup icon to view info/i,
      })
    ).toBeInTheDocument();
  });

  test("shows a request error instead of loading forever", async () => {
    fetcher.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);

    render(<LineupSite navigate={navigate} params={{}} />);

    expect(
      await screen.findByText(/lineup request failed with status 503/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/loading lineups/i)).not.toBeInTheDocument();
  });

  test("keeps start choices visible after opening a clustered lineup", async () => {
    const first = makeLineup({ id: "first", name: "First lineup" });
    const second = makeLineup({ id: "second", name: "Second lineup", startX: 500 });
    fetcher.mockResolvedValue(responseWith([first, second]));
    const { rerender } = render(<LineupSite navigate={navigate} params={{}} />);
    fireEvent.click(await screen.findByRole("img", { name: /ability marker/i }));
    expect(screen.getAllByRole("img", { name: /ability marker/i })).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("img", { name: /ability marker/i })[1]);
    expect(navigate).toHaveBeenCalledWith("/first");
    rerender(<LineupSite navigate={navigate} params={{ lineupId: first.id }} />);
    expect(await screen.findByRole("heading", { name: first.name })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /ability marker/i })).toHaveLength(3);
    fireEvent.mouseOver(screen.getAllByRole("img", { name: /ability marker/i })[0]);
    expect(screen.getAllByTestId("lineup-arrow")).toHaveLength(2);
  });

  test("loads lineups when the browser blocks local storage", async () => {
    const storage = jest.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    fetcher.mockResolvedValue(responseWith([makeLineup()]));
    try {
      render(<LineupSite navigate={navigate} params={{}} />);
      expect(await screen.findByRole("img", { name: /ability marker/i })).toBeInTheDocument();
      expect(screen.queryByText(/loading lineups/i)).not.toBeInTheDocument();
    } finally {
      storage.mockRestore();
    }
  });

  test("loading a map image does not dismiss an unfinished lineup request", () => {
    fetcher.mockReturnValue(new Promise<Response>(() => {}));
    render(<LineupSite navigate={navigate} params={{}} />);
    fireEvent.load(screen.getByRole("img", { name: /ascent map/i }));
    expect(screen.getByText(/loading lineups/i)).toBeInTheDocument();
  });
});
