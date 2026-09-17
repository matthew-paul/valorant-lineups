import { createEvent, fireEvent, render, screen } from "@testing-library/react";

import ImageFrame from "./ImageFrame";

describe("ImageFrame", () => {
  it("resets zoom when a different image replaces the previous lineup screenshot", () => {
    const { rerender } = render(<ImageFrame image="first.png" />);
    const image = screen.getByRole("img");
    // eslint-disable-next-line testing-library/no-node-access -- jsdom needs rendered geometry supplied for the zoom viewport.
    for (const element of [image, image.parentElement!]) {
      Object.defineProperties(element, {
        offsetWidth: { configurable: true, value: 100 },
        offsetHeight: { configurable: true, value: 100 },
      });
    }
    fireEvent.load(image);
    fireEvent.wheel(image, { deltaY: -100, clientX: 50, clientY: 50 });
    expect(image.style.transform).toContain("scale(1.1)");

    rerender(<ImageFrame image="second.png" />);
    expect(screen.getByRole("img")).not.toBe(image);
    expect(screen.getByRole("img").style.transform).toBe("");
  });

  it("prevents wheel scrolling only inside the image and removes the listener on unmount", () => {
    const { unmount } = render(<ImageFrame image="first.png" />);
    const image = screen.getByRole("img");
    // eslint-disable-next-line testing-library/no-node-access -- retain the event-listener target to check cleanup after unmount.
    const frame = image.closest(".image-frame")!;
    const imageWheel = createEvent.wheel(image, { cancelable: true });
    fireEvent(image, imageWheel);
    expect(imageWheel.defaultPrevented).toBe(true);

    const pageWheel = createEvent.wheel(document.body, { cancelable: true });
    fireEvent(document.body, pageWheel);
    expect(pageWheel.defaultPrevented).toBe(false);

    unmount();
    const detachedWheel = createEvent.wheel(frame, { cancelable: true });
    fireEvent(frame, detachedWheel);
    expect(detachedWheel.defaultPrevented).toBe(false);
  });
});
