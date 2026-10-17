import Image from "next/image";
import { CANVAS_RATIO } from "./layout";

export type ViewPiece = {
  id: string;
  name: string;
  photoUrl: string | null;
  x: number;
  y: number;
  width: number;
  z: number;
};

/**
 * A saved outfit drawn from its stored 0–1 positions (OU-3, OC-7), so it
 * matches the creator on any screen and leaves out deleted pieces.
 */
export function OutfitView({
  name,
  pieces,
}: {
  name: string;
  pieces: ViewPiece[];
}) {
  return (
    <div
      role="img"
      aria-label={`${name}: ${pieces.map((piece) => piece.name).join(", ")}`}
      className="relative w-full overflow-hidden rounded-xl bg-tile shadow-soft"
      style={{ aspectRatio: CANVAS_RATIO }}
    >
      {[...pieces]
        .sort((a, b) => a.z - b.z)
        .map((piece) =>
          piece.photoUrl ? (
            <Image
              key={piece.id}
              src={piece.photoUrl}
              alt=""
              width={800}
              height={800}
              unoptimized
              priority
              className="absolute h-auto max-w-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${piece.x * 100}%`,
                top: `${piece.y * 100}%`,
                width: `${piece.width * 100}%`,
              }}
            />
          ) : null,
        )}
    </div>
  );
}
