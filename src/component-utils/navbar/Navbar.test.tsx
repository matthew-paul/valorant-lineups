import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

import Navbar from "./Navbar";

const CurrentLocation = (): JSX.Element => <div data-testid="location">{useLocation().pathname}</div>;

describe("Navbar", () => {
  it("opens without changing the route, focuses its close button, and closes with Escape", () => {
    render(<MemoryRouter initialEntries={["/lineup-1"]}><Navbar /><CurrentLocation /></MemoryRouter>);
    const opener = screen.getByRole("button", { name: "Open navigation" });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    fireEvent.click(opener);
    expect(opener).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
    expect(screen.getByTestId("location")).toHaveTextContent("/lineup-1");

    fireEvent.keyDown(screen.getByRole("navigation"), { key: "Escape" });
    expect(opener).toHaveAttribute("aria-expanded", "false");
    expect(opener).toHaveFocus();
  });

  it("closes when a navigation link is selected", () => {
    render(<MemoryRouter><Navbar /><CurrentLocation /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(screen.getByRole("link", { name: "Info" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/about");
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  });
});
