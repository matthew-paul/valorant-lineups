/**
 * Taken from https://github.com/bradstiff/react-responsive-pinch-zoom-pan
 * and modified to allow the browser to handle mouse-wheel events.
 */

import React from "react";
import { createSelector } from "reselect";
import warning from "warning";

import DebugView from "./StateDebugView";
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
  type ClientPosition,
  type Dimensions,
  type ImageOverflow,
  type Point,
  type ScaleSetting,
  type Transform,
} from "./Utils";
import ZoomButtons from "./ZoomButtons";

const OVERZOOM_TOLERANCE = 0.05;
const DOUBLE_TAP_THRESHOLD = 250;
const ANIMATION_SPEED = 0.1;

type ImagePosition = "topLeft" | "center";
type DoubleTapBehavior = "reset" | "zoom";

interface ZoomableChildProps extends React.HTMLAttributes<HTMLElement> {
  ref?: React.Ref<HTMLElement>;
}

type ZoomableChildElement = React.ReactElement<ZoomableChildProps> & {
  ref?: React.Ref<HTMLElement>;
};

export interface PinchZoomPanProps {
  children: ZoomableChildElement;
  initialScale: ScaleSetting;
  minScale: ScaleSetting;
  maxScale: number;
  position: ImagePosition;
  zoomButtons: boolean;
  doubleTapBehavior: DoubleTapBehavior;
  initialTop?: number;
  initialLeft?: number;
  debug?: boolean;
}

interface PinchZoomPanState {
  top?: number;
  left?: number;
  scale?: number;
  containerDimensions?: Dimensions;
  imageDimensions?: Dimensions;
}

interface PanDistances {
  up: number;
  down: number;
  right: number;
  left: number;
}

type DefaultProps = Pick<
  PinchZoomPanProps,
  | "initialScale"
  | "minScale"
  | "maxScale"
  | "position"
  | "zoomButtons"
  | "doubleTapBehavior"
>;

const isInitialized = (
  top?: number,
  left?: number,
  scale?: number,
): boolean =>
  scale !== undefined && left !== undefined && top !== undefined;

const getStateTransform = (
  state: PinchZoomPanState,
): Transform | undefined => {
  const { top, left, scale } = state;
  return isInitialized(top, left, scale)
    ? { top: top as number, left: left as number, scale: scale as number }
    : undefined;
};

const selectTop = (state: PinchZoomPanState) => state.top;
const selectLeft = (state: PinchZoomPanState) => state.left;
const selectScale = (state: PinchZoomPanState) => state.scale;
const selectImageDimensions = (state: PinchZoomPanState) =>
  state.imageDimensions;
const selectContainerDimensions = (state: PinchZoomPanState) =>
  state.containerDimensions;

const imageStyle = createSelector(
  [selectTop, selectLeft, selectScale],
  (top, left, scale): React.CSSProperties => {
    const style: React.CSSProperties = {
      cursor: "pointer",
    };

    return isInitialized(top, left, scale)
      ? {
          ...style,
          transform: `translate3d(${left}px, ${top}px, 0) scale(${scale})`,
          transformOrigin: "0 0",
        }
      : style;
  },
);

const EMPTY_IMAGE_OVERFLOW: ImageOverflow = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const imageOverflow = createSelector(
  [
    selectTop,
    selectLeft,
    selectScale,
    selectImageDimensions,
    selectContainerDimensions,
  ],
  (
    top,
    left,
    scale,
    imageDimensions,
    containerDimensions,
  ): ImageOverflow => {
    if (
      !isInitialized(top, left, scale) ||
      !imageDimensions ||
      !containerDimensions
    ) {
      return EMPTY_IMAGE_OVERFLOW;
    }

    return getImageOverflow(
      top as number,
      left as number,
      scale as number,
      imageDimensions,
      containerDimensions,
    );
  },
);

const browserPanActions = createSelector(
  [imageOverflow],
  (overflow): string => {
    // Let the browser handle directions in which the image cannot be panned.
    const browserPanX =
      !overflow.left && !overflow.right
        ? "pan-x"
        : !overflow.left
          ? "pan-left"
          : !overflow.right
            ? "pan-right"
            : "";
    const browserPanY =
      !overflow.top && !overflow.bottom
        ? "pan-y"
        : !overflow.top
          ? "pan-up"
          : !overflow.bottom
            ? "pan-down"
            : "";

    return [browserPanX, browserPanY].join(" ").trim();
  },
);

// Ensure the image is not over-panned, and not over- or under-scaled.
// These constraints must be checked when the image or container changes.
export default class PinchZoomPan extends React.Component<
  PinchZoomPanProps,
  PinchZoomPanState
> {
  static defaultProps: DefaultProps = {
    initialScale: "auto",
    minScale: "auto",
    maxScale: 1,
    position: "topLeft",
    zoomButtons: true,
    doubleTapBehavior: "reset",
  };

  state: PinchZoomPanState = {};

  private lastPointerUpTimeStamp?: number;
  private lastPanPointerPosition: Point | null = null;
  private lastPinchLength: number | null = null;
  private animation?: number;
  private imageRef: HTMLElement | null = null;
  private isImageLoaded = false;
  private touchGestureMoved = false;

  private handleTouchStart: React.TouchEventHandler<HTMLElement> = (event) => {
    this.cancelAnimation();

    const { touches } = event;
    this.touchGestureMoved = touches.length !== 1;
    if (touches.length === 2) {
      this.lastPinchLength = getPinchLength(touches);
      this.lastPanPointerPosition = null;
    } else if (touches.length === 1) {
      this.lastPinchLength = null;
      this.pointerDown(touches[0]);
      tryCancelEvent(event);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    this.touchGestureMoved = true;
    const { touches } = event;
    if (touches.length === 2) {
      this.pinchChange(touches);
      tryCancelEvent(event);
    } else if (touches.length === 1) {
      const requestedPan = this.pan(touches[0]);
      if (!requestedPan || this.controlOverscrollViaCss) {
        return;
      }

      // Let the browser handle panning when the image has no remaining
      // overflow in the requested direction.
      const overflow = imageOverflow(this.state);
      const hasOverflowX =
        (requestedPan.left > 0 && overflow.left > 0) ||
        (requestedPan.right > 0 && overflow.right > 0);
      const hasOverflowY =
        (requestedPan.up > 0 && overflow.top > 0) ||
        (requestedPan.down > 0 && overflow.bottom > 0);

      if (!hasOverflowX && !hasOverflowY) {
        return;
      }

      const panX = requestedPan.left || requestedPan.right;
      const panY = requestedPan.up || requestedPan.down;
      if (panY > 2 * panX && !hasOverflowY) {
        return;
      }
      if (panX > 2 * panY && !hasOverflowX) {
        return;
      }

      tryCancelEvent(event);
    }
  };

  private handleTouchEnd: React.TouchEventHandler<HTMLElement> = (event) => {
    this.cancelAnimation();

    if (
      !this.touchGestureMoved &&
      event.touches.length === 0 &&
      event.changedTouches.length === 1
    ) {
      const pointerUpTimeStamp = this.lastPointerUpTimeStamp;
      const container = this.imageRef?.parentElement;
      if (
        container &&
        pointerUpTimeStamp !== undefined &&
        pointerUpTimeStamp + DOUBLE_TAP_THRESHOLD > event.timeStamp
      ) {
        const pointerPosition = getRelativePosition(
          event.changedTouches[0],
          container,
        );
        this.doubleClick(pointerPosition);
      }

      this.lastPointerUpTimeStamp = event.timeStamp;
      tryCancelEvent(event);
    } else {
      this.lastPointerUpTimeStamp = undefined;
    }

    this.lastPanPointerPosition = null;
    this.lastPinchLength = null;

    // We allow transient +/-5% over-pinching and then animate back.
    this.maybeAdjustCurrentTransform(ANIMATION_SPEED);
  };

  private handleMouseDown: React.MouseEventHandler<HTMLElement> = (event) => {
    this.cancelAnimation();
    this.pointerDown(event);
  };

  private handleMouseMove: React.MouseEventHandler<HTMLElement> = (event) => {
    if (event.buttons) {
      this.pan(event);
    }
  };

  private handleMouseDoubleClick: React.MouseEventHandler<HTMLElement> = (
    event,
  ) => {
    this.cancelAnimation();
    const container = this.imageRef?.parentElement;
    if (container) {
      this.doubleClick(getRelativePosition(event, container));
    }
  };

  private handleMouseWheel: React.WheelEventHandler<HTMLElement> = (event) => {
    this.cancelAnimation();
    const container = this.imageRef?.parentElement;
    const { scale } = this.state;
    if (!container || scale === undefined) {
      return;
    }

    const point = getRelativePosition(event, container);
    if (event.deltaY > 0 && scale > getMinScale(this.state, this.props)) {
      this.zoomOut(point);
    } else if (event.deltaY < 0 && scale < this.props.maxScale) {
      this.zoomIn(point);
    }
  };

  private handleImageLoad: React.ReactEventHandler<HTMLElement> = (event) => {
    this.debug("handleImageLoad");
    this.isImageLoaded = true;
    this.maybeHandleDimensionsChanged();

    const childElement = React.Children.only(this.props.children);
    if (typeof childElement.props.onLoad === "function") {
      childElement.props.onLoad(event);
    }
  };

  private handleZoomInClick = (): void => {
    this.cancelAnimation();
    this.zoomIn();
  };

  private handleZoomOutClick = (): void => {
    this.cancelAnimation();
    this.zoomOut();
  };

  private handleWindowResize = (): void => this.maybeHandleDimensionsChanged();

  private handleRefImage = (ref: HTMLElement | null): void => {
    if (this.imageRef) {
      this.cancelAnimation();
      this.imageRef.removeEventListener("touchmove", this.handleTouchMove);
    }

    this.imageRef = ref;
    if (ref) {
      ref.addEventListener("touchmove", this.handleTouchMove, {
        passive: false,
      });
    }

    const childElement = React.Children.only(
      this.props.children,
    ) as ZoomableChildElement;
    setRef(childElement.ref, ref);
  };

  private pointerDown(clientPosition: ClientPosition): void {
    const container = this.imageRef?.parentElement;
    this.lastPanPointerPosition = container
      ? getRelativePosition(clientPosition, container)
      : null;
  }

  private pan(pointerClientPosition: ClientPosition): PanDistances | null {
    const currentTransform = getStateTransform(this.state);
    const container = this.imageRef?.parentElement;
    if (!currentTransform || !container) {
      return null;
    }

    if (!this.lastPanPointerPosition) {
      // A finger may remain after a two-finger pinch ends.
      this.pointerDown(pointerClientPosition);
      return null;
    }

    const pointerPosition = getRelativePosition(
      pointerClientPosition,
      container,
    );
    const translateX = pointerPosition.x - this.lastPanPointerPosition.x;
    const translateY = pointerPosition.y - this.lastPanPointerPosition.y;
    this.lastPanPointerPosition = pointerPosition;

    this.constrainAndApplyTransform(
      currentTransform.top + translateY,
      currentTransform.left + translateX,
      currentTransform.scale,
      0,
      0,
    );

    return {
      up: translateY > 0 ? translateY : 0,
      down: translateY < 0 ? negate(translateY) : 0,
      right: translateX < 0 ? negate(translateX) : 0,
      left: translateX > 0 ? translateX : 0,
    };
  }

  private doubleClick(pointerPosition: Point): void {
    const { scale } = this.state;
    if (scale === undefined) {
      return;
    }

    if (
      this.props.doubleTapBehavior === "zoom" &&
      scale * (1 + OVERZOOM_TOLERANCE) < this.props.maxScale
    ) {
      this.zoomIn(pointerPosition, ANIMATION_SPEED, 0.3);
    } else {
      this.applyInitialTransform(ANIMATION_SPEED);
    }
  }

  private pinchChange(touches: TouchList): void {
    const currentScale = this.state.scale;
    const container = this.imageRef?.parentElement;
    if (currentScale === undefined || !container) {
      return;
    }

    const length = getPinchLength(touches);
    const midpoint = getPinchMidpoint(touches);
    const relativeMidpoint = getRelativePosition(
      { clientX: midpoint.x, clientY: midpoint.y },
      container,
    );
    const scale = this.lastPinchLength
      ? (currentScale * length) / this.lastPinchLength
      : currentScale;

    this.zoom(scale, relativeMidpoint, OVERZOOM_TOLERANCE);
    this.lastPinchLength = length;
  }

  private zoomIn(
    midpoint?: Point,
    speed = 0,
    factor = 0.1,
  ): void {
    const { containerDimensions, scale } = this.state;
    if (!containerDimensions || scale === undefined) {
      return;
    }

    const target = midpoint ?? {
      x: containerDimensions.width / 2,
      y: containerDimensions.height / 2,
    };
    this.zoom(scale * (1 + factor), target, 0, speed);
  }

  private zoomOut(midpoint?: Point): void {
    const { containerDimensions, scale } = this.state;
    if (!containerDimensions || scale === undefined) {
      return;
    }

    const target = midpoint ?? {
      x: containerDimensions.width / 2,
      y: containerDimensions.height / 2,
    };
    this.zoom(scale * 0.9, target, 0);
  }

  private zoom(
    requestedScale: number,
    containerRelativePoint: Point,
    tolerance: number,
    speed = 0,
  ): void {
    const currentTransform = getStateTransform(this.state);
    if (!currentTransform) {
      return;
    }

    const imageRelativePoint = {
      top: containerRelativePoint.y - currentTransform.top,
      left: containerRelativePoint.x - currentTransform.left,
    };

    const nextScale = this.getConstrainedScale(requestedScale, tolerance);
    const incrementalScalePercentage =
      (nextScale - currentTransform.scale) / currentTransform.scale;
    const translateY =
      imageRelativePoint.top * incrementalScalePercentage;
    const translateX =
      imageRelativePoint.left * incrementalScalePercentage;

    this.constrainAndApplyTransform(
      currentTransform.top - translateY,
      currentTransform.left - translateX,
      nextScale,
      tolerance,
      speed,
    );
  }

  // Compare stored dimensions to actual dimensions and capture changes.
  private maybeHandleDimensionsChanged(): void {
    if (!this.isImageReady || !this.imageRef) {
      this.debug("Image not loaded");
      return;
    }

    const containerDimensions = getContainerDimensions(this.imageRef);
    const imageDimensions = getDimensions(this.imageRef);
    if (
      !containerDimensions || !imageDimensions ||
      containerDimensions.width <= 0 || containerDimensions.height <= 0 ||
      imageDimensions.width <= 0 || imageDimensions.height <= 0
    ) {
      return;
    }

    if (
      isEqualDimensions(
        containerDimensions,
        this.state.containerDimensions,
      ) &&
      isEqualDimensions(imageDimensions, this.state.imageDimensions)
    ) {
      return;
    }

    this.cancelAnimation();
    this.setState(
      {
        containerDimensions,
        imageDimensions,
      },
      () => {
        if (!this.isTransformInitialized) {
          this.applyInitialTransform();
        } else {
          this.maybeAdjustCurrentTransform();
        }
      },
    );
    this.debug(
      `Dimensions changed: Container: ${containerDimensions.width}, ${containerDimensions.height}, Image: ${imageDimensions.width}, ${imageDimensions.height}`,
    );
  }

  private constrainAndApplyTransform(
    requestedTop: number,
    requestedLeft: number,
    requestedScale: number,
    tolerance: number,
    speed = 0,
  ): boolean {
    const requestedTransform: Transform = {
      top: requestedTop,
      left: requestedLeft,
      scale: requestedScale,
    };
    this.debug(
      `Requesting transform: left ${requestedLeft}, top ${requestedTop}, scale ${requestedScale}`,
    );

    const transform =
      this.getCorrectedTransform(requestedTransform, tolerance) ??
      requestedTransform;
    this.debug(
      `Applying transform: left ${transform.left}, top ${transform.top}, scale ${transform.scale}`,
    );

    if (isEqualTransform(transform, getStateTransform(this.state))) {
      return false;
    }

    this.applyTransform(transform, speed);
    return true;
  }

  private applyTransform(
    { top, left, scale }: Transform,
    speed: number,
  ): void {
    if (speed <= 0) {
      this.setState({ top, left, scale });
      return;
    }

    const frame = (): void => {
      const currentTransform = getStateTransform(this.state);
      if (!currentTransform) {
        return;
      }

      const nextTransform: Transform = {
        top: snapToTarget(
          currentTransform.top + speed * (top - currentTransform.top),
          top,
          1,
        ),
        left: snapToTarget(
          currentTransform.left + speed * (left - currentTransform.left),
          left,
          1,
        ),
        scale: snapToTarget(
          currentTransform.scale + speed * (scale - currentTransform.scale),
          scale,
          0.001,
        ),
      };

      if (!isEqualTransform(nextTransform, currentTransform)) {
        this.setState(nextTransform, () => {
          this.animation = requestAnimationFrame(frame);
        });
      }
    };

    this.animation = requestAnimationFrame(frame);
  }

  private getConstrainedScale(
    requestedScale: number,
    tolerance: number,
  ): number {
    return constrain(
      getMinScale(this.state, this.props) * (1 - tolerance),
      this.props.maxScale * (1 + tolerance),
      requestedScale,
    );
  }

  // Return a constrained transform, or null when no correction is needed.
  private getCorrectedTransform(
    requestedTransform: Transform,
    tolerance: number,
  ): Transform | null {
    const { imageDimensions, containerDimensions } = this.state;
    if (!imageDimensions || !containerDimensions) {
      return null;
    }

    const scale = this.getConstrainedScale(
      requestedTransform.scale,
      tolerance,
    );
    const negativeSpace = this.calculateNegativeSpace(scale);
    const overflow = {
      width: Math.max(0, negate(negativeSpace.width)),
      height: Math.max(0, negate(negativeSpace.height)),
    };

    const { position, initialTop, initialLeft } = this.props;
    const upperBoundFactor = 1 + tolerance;
    const top = overflow.height
      ? constrain(
          negate(overflow.height) * upperBoundFactor,
          overflow.height * upperBoundFactor - overflow.height,
          requestedTransform.top,
        )
      : position === "center"
        ? (containerDimensions.height - imageDimensions.height * scale) / 2
        : initialTop ?? 0;

    const left = overflow.width
      ? constrain(
          negate(overflow.width) * upperBoundFactor,
          overflow.width * upperBoundFactor - overflow.width,
          requestedTransform.left,
        )
      : position === "center"
        ? (containerDimensions.width - imageDimensions.width * scale) / 2
        : initialLeft ?? 0;

    const constrainedTransform: Transform = { top, left, scale };
    return isEqualTransform(constrainedTransform, requestedTransform)
      ? null
      : constrainedTransform;
  }

  private maybeAdjustCurrentTransform(speed = 0): void {
    const currentTransform = getStateTransform(this.state);
    if (!currentTransform) {
      return;
    }

    const correctedTransform = this.getCorrectedTransform(
      currentTransform,
      0,
    );
    if (correctedTransform) {
      this.applyTransform(correctedTransform, speed);
    }
  }

  private applyInitialTransform(speed = 0): void {
    const { imageDimensions, containerDimensions } = this.state;
    if (!imageDimensions || !containerDimensions) {
      return;
    }

    const {
      position,
      initialScale,
      maxScale,
      initialTop,
      initialLeft,
    } = this.props;
    const scale =
      initialScale === "auto"
        ? getAutofitScale(containerDimensions, imageDimensions)
        : initialScale;
    const minScale = getMinScale(this.state, this.props);

    if (minScale > maxScale) {
      warning(false, "minScale cannot exceed maxScale.");
      return;
    }
    if (scale < minScale || scale > maxScale) {
      warning(
        false,
        "initialScale must be between minScale and maxScale.",
      );
      return;
    }

    let initialPosition: Pick<Transform, "top" | "left">;
    if (position === "center") {
      warning(
        initialTop === undefined,
        "initialTop prop should not be supplied with position=center. It was ignored.",
      );
      warning(
        initialLeft === undefined,
        "initialLeft prop should not be supplied with position=center. It was ignored.",
      );
      initialPosition = {
        top: (containerDimensions.height - imageDimensions.height * scale) / 2,
        left: (containerDimensions.width - imageDimensions.width * scale) / 2,
      };
    } else {
      initialPosition = {
        top: initialTop ?? 0,
        left: initialLeft ?? 0,
      };
    }

    this.constrainAndApplyTransform(
      initialPosition.top,
      initialPosition.left,
      scale,
      0,
      speed,
    );
  }

  render(): React.ReactNode {
    const childElement = React.Children.only(this.props.children);
    const { zoomButtons, maxScale, debug } = this.props;
    const { scale } = this.state;

    const touchAction = this.controlOverscrollViaCss
      ? browserPanActions(this.state) || "none"
      : undefined;
    const containerStyle: React.CSSProperties = {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      touchAction,
    };

    return (
      <div style={containerStyle}>
        {zoomButtons &&
          this.isImageReady &&
          this.isTransformInitialized &&
          scale !== undefined && (
            <ZoomButtons
              scale={scale}
              minScale={getMinScale(this.state, this.props)}
              maxScale={maxScale}
              onZoomOutClick={this.handleZoomOutClick}
              onZoomInClick={this.handleZoomInClick}
            />
          )}
        {debug && (
          <DebugView
            top={this.state.top}
            left={this.state.left}
            scale={scale}
            overflow={imageOverflow(this.state)}
          />
        )}
        {React.cloneElement(childElement, {
          onTouchStart: this.handleTouchStart,
          onTouchEnd: this.handleTouchEnd,
          onMouseDown: this.handleMouseDown,
          onMouseMove: this.handleMouseMove,
          onDoubleClick: this.handleMouseDoubleClick,
          onWheel: this.handleMouseWheel,
          onDragStart: tryCancelEvent,
          onLoad: this.handleImageLoad,
          onContextMenu: tryCancelEvent,
          ref: this.handleRefImage,
          style: { ...childElement.props.style, ...imageStyle(this.state) },
        })}
      </div>
    );
  }

  componentDidMount(): void {
    // StrictMode can remount lifecycles without reattaching an unchanged ref.
    this.imageRef?.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    window.addEventListener("resize", this.handleWindowResize);
    this.maybeHandleDimensionsChanged();
  }

  componentDidUpdate(previousProps: PinchZoomPanProps): void {
    this.maybeHandleDimensionsChanged();
    if (
      previousProps.initialTop !== this.props.initialTop ||
      previousProps.initialLeft !== this.props.initialLeft ||
      previousProps.initialScale !== this.props.initialScale ||
      previousProps.position !== this.props.position
    ) {
      this.cancelAnimation();
      this.applyInitialTransform();
    } else if (
      previousProps.minScale !== this.props.minScale ||
      previousProps.maxScale !== this.props.maxScale
    ) {
      this.cancelAnimation();
      this.maybeAdjustCurrentTransform();
    }
  }

  componentWillUnmount(): void {
    this.cancelAnimation();
    this.imageRef?.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("resize", this.handleWindowResize);
  }

  private get isImageReady(): boolean {
    return Boolean(
      this.isImageLoaded ||
        (this.imageRef instanceof HTMLImageElement &&
          this.imageRef.complete && this.imageRef.naturalWidth > 0) ||
        (this.imageRef && this.imageRef.tagName !== "IMG"),
    );
  }

  private get isTransformInitialized(): boolean {
    return getStateTransform(this.state) !== undefined;
  }

  private get controlOverscrollViaCss(): boolean {
    return Boolean(
      typeof window !== "undefined" &&
        window.CSS &&
        typeof window.CSS.supports === "function" &&
        window.CSS.supports("touch-action", "pan-up"),
    );
  }

  private calculateNegativeSpace(scale: number): Dimensions {
    const { containerDimensions, imageDimensions } = this.state;
    if (!containerDimensions || !imageDimensions) {
      return { width: 0, height: 0 };
    }

    return {
      width: containerDimensions.width - scale * imageDimensions.width,
      height: containerDimensions.height - scale * imageDimensions.height,
    };
  }

  private cancelAnimation(): void {
    if (this.animation !== undefined) {
      cancelAnimationFrame(this.animation);
      this.animation = undefined;
    }
  }

  private debug(message: string): void {
    if (this.props.debug) {
      console.log(message);
    }
  }
}
