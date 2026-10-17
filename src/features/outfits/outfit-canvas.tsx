"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type Konva from "konva";
import "konva/lib/shapes/Image";
import "konva/lib/shapes/Transformer";
import {
  Image as KonvaImage,
  Layer,
  Stage,
  Transformer,
} from "react-konva/lib/ReactKonvaCore";
import { THUMB_MAX_EDGE } from "@/lib/images/prepare";
import { CANVAS_RATIO, fitItem, type CanvasItem } from "./layout";

/** Loads a photo the canvas can export later (ADR 0003: CORS, no tainting). */
function usePhoto(url: string | null) {
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setPhoto(image);
    image.src = url;
    return () => {
      image.onload = null;
    };
  }, [url]);
  return photo;
}

function CanvasPhoto({
  item,
  url,
  size,
  selected,
  handles,
  onSelect,
  onChange,
}: {
  item: CanvasItem;
  url: string | null;
  size: { width: number; height: number };
  selected: boolean;
  handles: RefObject<Konva.Transformer | null>;
  onSelect: () => void;
  onChange: (item: CanvasItem) => void;
}) {
  const photo = usePhoto(url);
  const node = useRef<Konva.Image>(null);
  // Attach the resize handles once this piece is selected and drawn.
  useEffect(() => {
    if (selected && photo && node.current)
      handles.current?.nodes([node.current]);
  }, [selected, photo, handles]);
  if (!photo) return null;
  const width = item.width * size.width;
  const height = width * (photo.height / photo.width);
  // Centre-based, so x/y are the stored centre (layout.ts).
  const read = (node: Konva.Node) => {
    const scale = node.scaleX();
    node.scale({ x: 1, y: 1 });
    onChange(
      fitItem({
        ...item,
        x: node.x() / size.width,
        y: node.y() / size.height,
        width: (width * scale) / size.width,
      }),
    );
  };
  return (
    <KonvaImage
      ref={node}
      image={photo}
      x={item.x * size.width}
      y={item.y * size.height}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      draggable
      dragBoundFunc={(pos) => ({
        x: Math.min(size.width, Math.max(0, pos.x)),
        y: Math.min(size.height, Math.max(0, pos.y)),
      })}
      onPointerDown={onSelect}
      onDragEnd={(event) => read(event.target)}
      onTransformEnd={(event) => read(event.target)}
    />
  );
}

/**
 * The outfit canvas (OC-4, OC-5, OC-7), drawn with react-konva (ADR 0003).
 * Positions come in and go out as 0–1 shares; pixels only live in here.
 */
export default function OutfitCanvas({
  items,
  photos,
  selectedId,
  onSelect,
  onChange,
  snapshotRef,
}: {
  items: CanvasItem[];
  photos: Map<string, { url: string | null; name: string }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (item: CanvasItem) => void;
  /** Set to a function that draws the outfit for its thumbnail (OC-10). */
  snapshotRef: RefObject<(() => HTMLCanvasElement | null) | null>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const transformer = useRef<Konva.Transformer>(null);
  const [width, setWidth] = useState(0);
  // Konva draws on a canvas, so it takes theme colors as values, not classes.
  const [theme] = useState(() => {
    const css = getComputedStyle(document.documentElement);
    return {
      brand: css.getPropertyValue("--brand").trim(),
      fill: css.getPropertyValue("--background").trim(),
      tile: css.getPropertyValue("--tile").trim(),
      touch: window.matchMedia("(pointer: coarse)").matches,
    };
  });
  const size = { width, height: width / CANVAS_RATIO };

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The thumbnail: the pieces without handles, on the tile color (JPEG has no
  // transparency), THUMB_MAX_EDGE tall.
  useEffect(() => {
    snapshotRef.current = () => {
      const handles = transformer.current;
      if (!stage.current || !handles || !width) return null;
      handles.visible(false);
      const drawn = stage.current.toCanvas({
        pixelRatio: THUMB_MAX_EDGE / (width / CANVAS_RATIO),
      });
      handles.visible(true);
      const picture = document.createElement("canvas");
      picture.width = drawn.width;
      picture.height = drawn.height;
      const context = picture.getContext("2d");
      if (!context) return null;
      context.fillStyle = theme.tile;
      context.fillRect(0, 0, picture.width, picture.height);
      context.drawImage(drawn, 0, 0);
      return picture;
    };
    return () => {
      snapshotRef.current = null;
    };
  }, [snapshotRef, width, theme.tile]);

  // Selected pieces attach the handles themselves (CanvasPhoto).
  useEffect(() => {
    if (!selectedId) transformer.current?.nodes([]);
  }, [selectedId]);

  const sorted = [...items].sort((a, b) => a.z - b.z);
  return (
    <div
      ref={box}
      role="img"
      aria-label={
        sorted.length
          ? `Outfit canvas: ${sorted.map((item) => photos.get(item.id)?.name).join(", ")}`
          : "Outfit canvas, empty"
      }
      className="aspect-[3/4] w-full touch-none overflow-hidden rounded-xl bg-tile shadow-soft"
    >
      {width > 0 && (
        <Stage
          ref={stage}
          width={size.width}
          height={size.height}
          onPointerDown={(event) => {
            if (event.target === event.target.getStage()) onSelect(null);
          }}
        >
          <Layer>
            {sorted.map((item) => (
              <CanvasPhoto
                key={item.id}
                item={item}
                url={photos.get(item.id)?.url ?? null}
                size={size}
                selected={item.id === selectedId}
                handles={transformer}
                onSelect={() => onSelect(item.id)}
                onChange={onChange}
              />
            ))}
            <Transformer
              ref={transformer}
              keepRatio
              rotateEnabled={false}
              flipEnabled={false}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              anchorSize={theme.touch ? 24 : 14}
              anchorCornerRadius={theme.touch ? 12 : 7}
              anchorStroke={theme.brand}
              anchorFill={theme.fill}
              borderStroke={theme.brand}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 24 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
