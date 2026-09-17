import {
  constrain,
  getAutofitScale,
  getContainerDimensions,
  getDimensions,
  getImageOverflow,
  getMinScale,
  getPinchLength,
  getPinchMidpoint,
  getRelativePosition,
  isEqualDimensions,
  isEqualTransform,
  negate,
  setRef,
  snapToTarget,
  tryCancelEvent,
} from "./Utils";

describe("responsive pinch/zoom utility calculations", () => {
  describe("numeric helpers", () => {
    it("snaps only values strictly inside the requested tolerance", () => {
      expect(snapToTarget(9.95, 10, 0.1)).toBe(10);
      expect(snapToTarget(9, 10, 1)).toBe(9);
    });

    it("constrains values at both bounds and negates values", () => {
      expect(constrain(2, 8, -1)).toBe(2);
      expect(constrain(2, 8, 5)).toBe(5);
      expect(constrain(2, 8, 12)).toBe(8);
      expect(negate(7)).toBe(-7);
      expect(negate(-7)).toBe(7);
    });
  });

  describe("pointer geometry", () => {
    it("converts viewport coordinates to element-relative coordinates", () => {
      const element = document.createElement("div");
      jest.spyOn(element, "getBoundingClientRect").mockReturnValue({
        top: 20,
        left: 30,
        right: 130,
        bottom: 120,
        width: 100,
        height: 100,
        x: 30,
        y: 20,
        toJSON: () => ({}),
      });

      expect(
        getRelativePosition({ clientX: 55, clientY: 90 }, element),
      ).toEqual({ x: 25, y: 70 });
    });

    it("calculates the midpoint and distance between two touches", () => {
      const touches = [
        { clientX: 1, clientY: 2 },
        { clientX: 4, clientY: 6 },
      ];

      expect(getPinchMidpoint(touches)).toEqual({ x: 2.5, y: 4 });
      expect(getPinchLength(touches)).toBe(5);
    });
  });

  describe("dimension helpers", () => {
    it("treats two missing dimension records as equal", () => {
      expect(isEqualDimensions(undefined, undefined)).toBe(true);
      expect(isEqualDimensions(undefined, { width: 1, height: 1 })).toBe(
        false,
      );
    });

    it("compares both width and height", () => {
      expect(
        isEqualDimensions(
          { width: 640, height: 480 },
          { width: 640, height: 480 },
        ),
      ).toBe(true);
      expect(
        isEqualDimensions(
          { width: 640, height: 480 },
          { width: 640, height: 481 },
        ),
      ).toBe(false);
    });

    it("prefers rendered dimensions and falls back to intrinsic dimensions", () => {
      expect(
        getDimensions({
          offsetWidth: 320,
          offsetHeight: 180,
          width: 640,
          height: 360,
        }),
      ).toEqual({ width: 320, height: 180 });
      expect(
        getDimensions({
          offsetWidth: 0,
          offsetHeight: 0,
          width: 640,
          height: 360,
        }),
      ).toEqual({ width: 640, height: 360 });
      expect(getDimensions(null)).toBeUndefined();
    });

    it("reads dimensions from an element parent and handles a detached element", () => {
      const container = document.createElement("div");
      const image = document.createElement("img");
      Object.defineProperties(container, {
        offsetWidth: { configurable: true, value: 500 },
        offsetHeight: { configurable: true, value: 300 },
      });
      container.appendChild(image);

      expect(getContainerDimensions(image)).toEqual({
        width: 500,
        height: 300,
      });
      expect(getContainerDimensions(document.createElement("img"))).toBeUndefined();
    });
  });

  describe("scale and transform helpers", () => {
    it("compares transforms at the component's five-decimal precision", () => {
      expect(isEqualTransform(undefined, undefined)).toBe(true);
      expect(
        isEqualTransform(
          { top: 1.000001, left: 2, scale: 3 },
          { top: 1.000002, left: 2, scale: 3 },
        ),
      ).toBe(true);
      expect(
        isEqualTransform(
          { top: 1.00001, left: 2, scale: 3 },
          { top: 1.00002, left: 2, scale: 3 },
        ),
      ).toBe(false);
    });

    it("fits an image inside its container without scaling it above 100%", () => {
      expect(
        getAutofitScale(
          { width: 400, height: 300 },
          { width: 800, height: 300 },
        ),
      ).toBe(0.5);
      expect(
        getAutofitScale(
          { width: 800, height: 600 },
          { width: 400, height: 300 },
        ),
      ).toBe(1);
      expect(getAutofitScale(undefined, { width: 400, height: 300 })).toBe(1);
      expect(
        getAutofitScale(
          { width: 800, height: 600 },
          { width: 0, height: 300 },
        ),
      ).toBe(1);
    });

    it("resolves automatic, explicit, and missing minimum scales", () => {
      const state = {
        containerDimensions: { width: 400, height: 300 },
        imageDimensions: { width: 800, height: 600 },
      };

      expect(getMinScale(state, { minScale: "auto" })).toBe(0.5);
      expect(getMinScale(state, { minScale: 0.75 })).toBe(0.75);
      expect(getMinScale(state, {})).toBe(1);
    });
  });

  describe("overflow calculations", () => {
    it("reports no overflow for a smaller centered image", () => {
      expect(getImageOverflow(25, 25, 1, { width: 50, height: 50 }, { width: 100, height: 100 }))
        .toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });
    it("reports the remaining overflow on all four sides", () => {
      expect(
        getImageOverflow(
          -10,
          -25,
          1,
          { width: 200, height: 100 },
          { width: 100, height: 50 },
        ),
      ).toEqual({
        top: 10,
        right: 75,
        bottom: 40,
        left: 25,
      });
    });

    it("never reports negative overflow after transient over-panning", () => {
      expect(
        getImageOverflow(
          -100,
          -150,
          1,
          { width: 200, height: 100 },
          { width: 100, height: 50 },
        ),
      ).toEqual({
        top: 100,
        right: 0,
        bottom: 0,
        left: 150,
      });
    });
  });

  describe("imperative browser helpers", () => {
    it("updates callback and object refs", () => {
      const callbackRef = jest.fn();
      const objectRef: React.MutableRefObject<HTMLDivElement | null> = {
        current: null,
      };
      const element = document.createElement("div");

      setRef(callbackRef, element);
      setRef(objectRef, element);

      expect(callbackRef).toHaveBeenCalledWith(element);
      expect(objectRef.current).toBe(element);
    });

    it("prevents cancelable events and leaves non-cancelable events alone", () => {
      const cancelablePreventDefault = jest.fn();
      const fixedPreventDefault = jest.fn();

      expect(
        tryCancelEvent({
          cancelable: true,
          preventDefault: cancelablePreventDefault,
        }),
      ).toBe(true);
      expect(cancelablePreventDefault).toHaveBeenCalledTimes(1);

      expect(
        tryCancelEvent({
          cancelable: false,
          preventDefault: fixedPreventDefault,
        }),
      ).toBe(false);
      expect(fixedPreventDefault).not.toHaveBeenCalled();
    });
  });
});
