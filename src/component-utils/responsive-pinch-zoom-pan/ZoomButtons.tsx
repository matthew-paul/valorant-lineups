import type { CSSProperties, MouseEventHandler } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";

import "./styles.css";

const iconStyle: CSSProperties = {
  width: "1.25em",
  verticalAlign: "-0.125em",
};

interface ZoomButtonsProps {
  scale: number;
  minScale: number;
  maxScale: number;
  onZoomInClick: MouseEventHandler<HTMLButtonElement>;
  onZoomOutClick: MouseEventHandler<HTMLButtonElement>;
}

const ZoomButtons = ({
  scale,
  minScale,
  maxScale,
  onZoomInClick,
  onZoomOutClick,
}: ZoomButtonsProps): JSX.Element => (
  <div style={{ position: "absolute", zIndex: 1000 }}>
    <button
      type="button"
      aria-label="Zoom out"
      className="iconButton"
      style={{ margin: "10px" }}
      onClick={onZoomOutClick}
      disabled={scale <= minScale}
    >
      <FaMinus style={iconStyle} />
    </button>
    <button
      type="button"
      aria-label="Zoom in"
      className="iconButton"
      style={{ marginTop: "10px", marginLeft: "0px" }}
      onClick={onZoomInClick}
      disabled={scale >= maxScale}
    >
      <FaPlus style={iconStyle} />
    </button>
  </div>
);

export default ZoomButtons;
