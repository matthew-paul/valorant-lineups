import React from "react";
import MapInteraction, {
  type MapInteractionValue,
  type MapInteractionProps,
} from "react-map-interaction";

export interface MapInteractionCSSProps
  extends Omit<MapInteractionProps, "children"> {
  children: React.ReactNode;
  updateScale: (scale: number) => void;
}

interface TransformedContentProps extends MapInteractionValue {
  children: React.ReactNode;
  updateScale: (scale: number) => void;
}

const TransformedContent = ({
  children,
  translation,
  scale,
  updateScale,
}: TransformedContentProps): JSX.Element => {
  React.useEffect(() => {
    // Scale markers slightly less aggressively than the map.
    updateScale(scale ** 0.8);
  }, [scale, updateScale]);

  // Translate first and then scale. Otherwise, scaling would affect translation.
  const transform = `translate(${translation.x}px, ${translation.y}px) scale(${scale})`;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative", // for absolutely positioned children
        overflow: "hidden",
        touchAction: "none", // Not supported in Safari :(
        msTouchAction: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      <div
        style={{
          display: "inline-block", // size to content
          transform,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/*
  This component provides a map like interaction to any content that you place in it. It will let
  the user zoom and pan the children by scaling and translating props.children using css.
*/
const MapInteractionCSS = ({
  children,
  updateScale,
  ...interactionProps
}: MapInteractionCSSProps): JSX.Element => {
  return (
    <MapInteraction {...interactionProps}>
      {({ translation, scale }) => (
        <TransformedContent
          translation={translation}
          scale={scale}
          updateScale={updateScale}
        >
          {children}
        </TransformedContent>
      )}
    </MapInteraction>
  );
};

export default MapInteractionCSS;
