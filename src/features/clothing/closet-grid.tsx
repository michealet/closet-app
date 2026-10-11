import Link from "next/link";
import { ImageTile } from "@/components/shared/image-tile";

export type GridItem = { id: string; name: string; photoUrl: string | null };

/** CL-1: image grid, 2 columns on phones up to 6 on wide screens. */
export function ClosetGrid({ items }: { items: GridItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/closet/${item.id}`}
            className="group block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ImageTile
              src={item.photoUrl}
              alt={item.name}
              className="transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]"
            />
            <p className="mt-2 truncate text-sm">{item.name}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
