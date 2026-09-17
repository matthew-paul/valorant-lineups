import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";

import PinchZoomPan from "./PinchZoomPan";

const setDimensions = (element: HTMLElement, width: number, height: number): void => {
  Object.defineProperties(element, {
    offsetWidth: { configurable: true, value: width },
    offsetHeight: { configurable: true, value: height },
  });
};

const initializeImage = (): HTMLImageElement => {
  const image = screen.getByRole("img") as HTMLImageElement;
  setDimensions(image, 100, 100);
  // eslint-disable-next-line testing-library/no-node-access -- jsdom needs rendered geometry supplied for the zoom viewport.
  const container = image.parentElement!;
  setDimensions(container, 100, 100);
  jest.spyOn(container, "getBoundingClientRect").mockReturnValue({
    top: 100, left: 200, right: 300, bottom: 200,
    width: 100, height: 100, x: 200, y: 100, toJSON: () => ({}),
  });
  fireEvent.load(image);
  return image;
};

describe("PinchZoomPan interactions", () => {
  it("keeps the touched point stationary when pinching a frame away from the viewport origin", () => {
    render(<StrictMode><PinchZoomPan initialScale={1} minScale={1} maxScale={4}><img src="lineup.png" alt="lineup" /></PinchZoomPan></StrictMode>);
    const image = initializeImage();

    fireEvent.touchStart(image, { touches: [
      { clientX: 240, clientY: 150 }, { clientX: 260, clientY: 150 },
    ] });
    fireEvent.touchMove(image, { touches: [
      { clientX: 230, clientY: 150 }, { clientX: 270, clientY: 150 },
    ] });

    expect(image.style.transform).toBe("translate3d(-50px, -50px, 0) scale(2)");
  });

  it("preserves child styles and applies changed zoom limits and initial settings", () => {
    const { rerender } = render(
      <PinchZoomPan initialScale={1} minScale={1} maxScale={4}>
        <img src="lineup.png" alt="lineup" style={{ borderRadius: 8 }} />
      </PinchZoomPan>,
    );
    const image = initializeImage();
    expect(image.style.borderRadius).toBe("8px");
    fireEvent.wheel(image, { deltaY: -100, clientX: 250, clientY: 150 });
    expect(image.style.transform).toContain("scale(1.1)");

    rerender(<PinchZoomPan initialScale={1} minScale={1} maxScale={1}><img src="lineup.png" alt="lineup" /></PinchZoomPan>);
    expect(image.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
    rerender(<PinchZoomPan initialScale={2} minScale={1} maxScale={4}><img src="lineup.png" alt="lineup" /></PinchZoomPan>);
    expect(image.style.transform).toContain("scale(2)");
  });

  it("waits for measurable dimensions before initializing an automatic scale", () => {
    render(<PinchZoomPan><img src="lineup.png" alt="lineup" /></PinchZoomPan>);
    const image = screen.getByRole("img");
    fireEvent.load(image);
    expect(image.style.transform).toBe("");
    initializeImage();
    expect(image.style.transform).toContain("scale(1)");
  });
});
