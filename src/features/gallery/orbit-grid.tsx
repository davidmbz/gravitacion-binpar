import type { ReactNode } from "react";
import type { OrbitCurve } from "@/lib/physics/orbits";

export interface GalleryCard {
  slug: string;
  curve: OrbitCurve;
  content: ReactNode;
}

export function OrbitGrid({ cards }: { cards: readonly GalleryCard[] }) {
  return (
    <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <li key={card.slug}>{card.content}</li>
      ))}
    </ul>
  );
}
