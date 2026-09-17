declare module "react-map-interaction" {
  import type { ComponentType, ReactNode } from "react";

  export interface MapInteractionPoint {
    x: number;
    y: number;
  }

  export interface MapInteractionValue {
    scale: number;
    translation: MapInteractionPoint;
  }

  export interface TranslationBounds {
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
  }

  export interface MapInteractionProps {
    children: (value: MapInteractionValue) => ReactNode;
    value?: MapInteractionValue;
    defaultValue?: MapInteractionValue;
    onChange?: (value: MapInteractionValue) => void;
    minScale?: number;
    maxScale?: number;
    disableZoom?: boolean;
    disablePan?: boolean;
    translationBounds?: TranslationBounds;
  }

  const MapInteraction: ComponentType<MapInteractionProps>;
  export default MapInteraction;
}
