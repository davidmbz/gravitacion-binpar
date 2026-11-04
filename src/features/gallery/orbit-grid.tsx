import type { ReactNode } from "react";
import type { OrbitCurve } from "@/lib/physics/orbits";

export interface GalleryCard {
  slug: string;
  curve: OrbitCurve;
  isWide: boolean;
  content: ReactNode;
}

export function OrbitGrid({ cards }: { cards: readonly GalleryCard[] }) {
  return (
    // Dos filas fijas en escritorio: al filtrar, las láminas no se estiran.
    <ul className="grid min-h-0 flex-1 grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-2">
      {cards.map((card) => (
        <li
          key={card.slug}
          className={
            card.isWide
              ? "col-span-2 aspect-[3/2] sm:aspect-[2/1] lg:aspect-auto"
              : "aspect-[3/4] sm:aspect-square lg:aspect-auto"
          }
        >
          {card.content}
        </li>
      ))}
    </ul>
  );
}
