import { useEffect, useRef } from "react";
import PinchZoomPan from "../responsive-pinch-zoom-pan/PinchZoomPan";

export interface ImageFrameProps {
  image: string;
}

export const ImageFrame = ({ image }: ImageFrameProps): JSX.Element => {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // Keep wheel zoom from scrolling the containing page. Scope the listener
    // to this frame so changing lineups cannot leave the whole page locked.
    const preventWheelScroll = (event: WheelEvent): void => event.preventDefault();
    frame.addEventListener("wheel", preventWheelScroll, { passive: false });
    return () => frame.removeEventListener("wheel", preventWheelScroll);
  }, []);

  return (
    <div className="image-frame" ref={frameRef}>
      <PinchZoomPan
        key={image}
        doubleTapBehavior="zoom"
        position="center"
        initialScale={1}
        minScale={1}
        maxScale={15}
        zoomButtons={false}
      >
        <img
          className="lineup-image"
          src={image}
          alt="lineup info"
        />
      </PinchZoomPan>
    </div>
  );
};

export default ImageFrame;
