import type React from "react";
import { createSelector } from "reselect";

export interface Dimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  top: number;
  left: number;
  scale: number;
}

export interface ImageOverflow {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ClientPosition {
  clientX: number;
  clientY: number;
}

export interface PinchTouches {
  readonly length: number;
  readonly [index: number]: ClientPosition;
}

export interface DimensionState {
  containerDimensions?: Dimensions;
  imageDimensions?: Dimensions;
}

export type ScaleSetting = number | "auto";

export interface MinimumScaleProps {
  minScale?: ScaleSetting;
}

interface CancelableEvent {
  cancelable: boolean;
  preventDefault(): void;
}

type DimensionSource =
  | Dimensions
  | (Pick<HTMLElement, "offsetWidth" | "offsetHeight"> &
      Partial<Dimensions>);

export const snapToTarget = (
  value: number,
  target: number,
  tolerance: number,
): number => (Math.abs(target - value) < tolerance ? target : value);

export const constrain = (
  lowerBound: number,
  upperBound: number,
  value: number,
): number => Math.min(upperBound, Math.max(lowerBound, value));

export const negate = (value: number): number => value * -1;

export const getRelativePosition = (
  { clientX, clientY }: ClientPosition,
  relativeToElement: Element,
): Point => {
  const rect = relativeToElement.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

export const getPinchMidpoint = (touches: PinchTouches): Point => {
  const touch1 = touches[0];
  const touch2 = touches[1];

  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
};

export const getPinchLength = (touches: PinchTouches): number => {
  const touch1 = touches[0];
  const touch2 = touches[1];

  return Math.sqrt(
    Math.pow(touch1.clientY - touch2.clientY, 2) +
      Math.pow(touch1.clientX - touch2.clientX, 2),
  );
};

export function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

export const isEqualDimensions = (
  dimensions1?: Dimensions,
  dimensions2?: Dimensions,
): boolean => {
  if (dimensions1 === undefined && dimensions2 === undefined) {
    return true;
  }
  if (dimensions1 === undefined || dimensions2 === undefined) {
    return false;
  }

  return (
    dimensions1.width === dimensions2.width &&
    dimensions1.height === dimensions2.height
  );
};

export const getDimensions = (
  object?: DimensionSource | null,
): Dimensions | undefined => {
  if (object == null) {
    return undefined;
  }

  const offsetWidth = "offsetWidth" in object ? object.offsetWidth : 0;
  const offsetHeight = "offsetHeight" in object ? object.offsetHeight : 0;

  return {
    width: offsetWidth || object.width || 0,
    height: offsetHeight || object.height || 0,
  };
};

export const getContainerDimensions = (
  image: HTMLElement,
): Dimensions | undefined => getDimensions(image.parentElement);

export const isEqualTransform = (
  transform1?: Transform,
  transform2?: Transform,
): boolean => {
  if (transform1 === undefined && transform2 === undefined) {
    return true;
  }
  if (transform1 === undefined || transform2 === undefined) {
    return false;
  }

  return (
    round(transform1.top, 5) === round(transform2.top, 5) &&
    round(transform1.left, 5) === round(transform2.left, 5) &&
    round(transform1.scale, 5) === round(transform2.scale, 5)
  );
};

export const getAutofitScale = (
  containerDimensions?: Dimensions,
  imageDimensions?: Dimensions,
): number => {
  if (
    !containerDimensions ||
    !imageDimensions ||
    containerDimensions.width <= 0 ||
    containerDimensions.height <= 0 ||
    imageDimensions.width <= 0 ||
    imageDimensions.height <= 0
  ) {
    return 1;
  }

  return Math.min(
    containerDimensions.width / imageDimensions.width,
    containerDimensions.height / imageDimensions.height,
    1,
  );
};

const selectContainerDimensions = (state: DimensionState) =>
  state.containerDimensions;
const selectImageDimensions = (state: DimensionState) => state.imageDimensions;
const selectMinimumScale = (
  _state: DimensionState,
  props: MinimumScaleProps,
) => props.minScale;

export const getMinScale = createSelector(
  [selectContainerDimensions, selectImageDimensions, selectMinimumScale],
  (containerDimensions, imageDimensions, minScaleProp): number => {
    if (minScaleProp === "auto") {
      return getAutofitScale(containerDimensions, imageDimensions);
    }

    return minScaleProp || 1;
  },
);

function round(number: number, precision: number): number {
  if (!precision) {
    return Math.round(number);
  }

  // Shift with exponential notation to avoid floating-point issues.
  const [coefficient, exponent = "0"] = `${number}e`.split("e");
  const shifted = Math.round(
    Number(`${coefficient}e${Number(exponent) + precision}`),
  );
  const [shiftedCoefficient, shiftedExponent = "0"] = `${shifted}e`.split("e");

  return Number(
    `${shiftedCoefficient}e${Number(shiftedExponent) - precision}`,
  );
}

export const tryCancelEvent = (event: CancelableEvent): boolean => {
  if (event.cancelable === false) {
    return false;
  }

  event.preventDefault();
  return true;
};

const calculateOverflowLeft = (left: number): number =>
  Math.max(0, negate(left));

const calculateOverflowTop = (top: number): number =>
  Math.max(0, negate(top));

const calculateOverflowRight = (
  left: number,
  scale: number,
  imageDimensions: Dimensions,
  containerDimensions: Dimensions,
): number => {
  return Math.max(
    0,
    scale * imageDimensions.width + left - containerDimensions.width,
  );
};

const calculateOverflowBottom = (
  top: number,
  scale: number,
  imageDimensions: Dimensions,
  containerDimensions: Dimensions,
): number => {
  return Math.max(
    0,
    scale * imageDimensions.height + top - containerDimensions.height,
  );
};

export const getImageOverflow = (
  top: number,
  left: number,
  scale: number,
  imageDimensions: Dimensions,
  containerDimensions: Dimensions,
): ImageOverflow => ({
  top: calculateOverflowTop(top),
  right: calculateOverflowRight(
    left,
    scale,
    imageDimensions,
    containerDimensions,
  ),
  bottom: calculateOverflowBottom(
    top,
    scale,
    imageDimensions,
    containerDimensions,
  ),
  left: calculateOverflowLeft(left),
});
