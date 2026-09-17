import { fireEvent, render, screen } from "@testing-library/react";

import { makeLineup } from "../test-utils/lineup-fixtures";
import SelectLineupPage from "./SelectLineupPage";

describe("SelectLineupPage", () => {
  let fetcher: jest.MockedFunction<typeof fetch>;
  const openWindow = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetcher,
    });
    Object.defineProperty(window, "open", {
      configurable: true,
      writable: true,
      value: openWindow,
    });
    openWindow.mockReset();
  });

  test("stores a selected record and opens the editor", async () => {
    const lineup = makeLineup({ id: "edit-me", mapId: 11 });
    fetcher.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [lineup],
    } as Response);

    render(<SelectLineupPage />);

    const marker = await screen.findByRole("img", {
      name: /ability marker/i,
    });
    fireEvent.click(marker);

    expect(JSON.parse(localStorage.getItem("editMarker") ?? "null")).toEqual(
      lineup
    );
    expect(openWindow).toHaveBeenCalledWith("/edit", "_blank", "noopener,noreferrer");
  });

  test("updates markers when changing maps without waiting for an image load", async () => {
    fetcher.mockResolvedValue({
      ok: true, status: 200,
      json: async () => [makeLineup({ mapId: 1 })],
    } as Response);
    render(<SelectLineupPage />);
    await screen.findByRole("img", { name: /abyss map/i });
    fireEvent.keyDown(screen.getByLabelText("Map select"), { key: "ArrowDown" });
    fireEvent.click(screen.getByText("Ascent"));
    expect(await screen.findByRole("img", { name: /ability marker/i })).toBeInTheDocument();
  });

  test("explains a storage failure without opening an empty editor", async () => {
    fetcher.mockResolvedValue({
      ok: true, status: 200,
      json: async () => [makeLineup({ mapId: 11 })],
    } as Response);
    render(<SelectLineupPage />);
    const marker = await screen.findByRole("img", { name: /ability marker/i });
    const storage = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    try {
      fireEvent.click(marker);
      expect(screen.getByText(/browser storage is unavailable/i)).toBeInTheDocument();
      expect(openWindow).not.toHaveBeenCalled();
    } finally {
      storage.mockRestore();
    }
  });
});
