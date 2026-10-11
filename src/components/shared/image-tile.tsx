import { ShirtIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A clothing or outfit image on the light tile (DS-5). Images are signed
 * Storage URLs, so they skip Next's optimizer; they still lazy-load (NF-2).
 */
export function ImageTile({
  src,
  alt,
  sizes = "(min-width: 1024px) 16vw, (min-width: 768px) 25vw, 50vw",
  priority = false,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-xl bg-tile",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          priority={priority}
          className="object-contain p-2"
        />
      ) : (
        <ShirtIcon
          role="img"
          aria-label={alt}
          className="absolute inset-0 m-auto size-8 text-muted-foreground"
        />
      )}
    </div>
  );
}
