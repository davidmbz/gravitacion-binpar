"use client";

import { useSearchParams } from "next/navigation";
import {
  startTransition,
  useEffect,
  useOptimistic,
  type ReactNode,
} from "react";
import {
  CURVE_PARAM,
  curveFilterSearch,
  matchesFilter,
  parseCurveFilter,
  type CurveFilter,
} from "./curve-filter";
import { GalleryControls } from "./gallery-controls";
import { OrbitGrid, type GalleryCard } from "./orbit-grid";
import { takeOpenedOrbit } from "./return-origin";

type FilterableGalleryProps = {
  title: ReactNode;
  cards: readonly GalleryCard[];
};

export function FilterableGallery({ title, cards }: FilterableGalleryProps) {
  const urlFilter = parseCurveFilter(useSearchParams().get(CURVE_PARAM));
  // useSearchParams se actualiza en una transición: sin esto, el radio volvería
  // un instante a su valor anterior. La URL sigue siendo la fuente de verdad.
  const [filter, setOptimisticFilter] = useOptimistic(urlFilter);
  const visibleCards = cards.filter((card) =>
    matchesFilter(card.curve, filter),
  );

  // Next no gestiona el foco al navegar. El efecto corre al montar y también
  // cada vez que Activity vuelve a mostrar la página.
  useEffect(() => {
    const slug = takeOpenedOrbit();
    if (slug) {
      document.getElementById(`orbita-${slug}`)?.focus({ preventScroll: true });
    }
  }, []);

  function selectFilter(next: CurveFilter) {
    startTransition(() => {
      setOptimisticFilter(next);
      // replaceState se integra con useSearchParams y no va al servidor.
      window.history.replaceState(
        null,
        "",
        `/orbitas${curveFilterSearch(next)}`,
      );
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        {title}
        <GalleryControls
          filter={filter}
          visibleCount={visibleCards.length}
          totalCount={cards.length}
          onSelect={selectFilter}
        />
      </div>
      <OrbitGrid cards={visibleCards} />
    </>
  );
}
