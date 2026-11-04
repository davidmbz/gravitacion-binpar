"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  CURVE_FILTERS,
  CURVE_PARAM,
  curveFilterSearch,
  matchesFilter,
  parseCurveFilter,
  type CurveFilter,
} from "./curve-filter";
import { OrbitGrid, type GalleryCard } from "./orbit-grid";
import { takeOpenedOrbit } from "./return-origin";

export function FilterableGallery({
  cards,
}: {
  cards: readonly GalleryCard[];
}) {
  const filter = parseCurveFilter(useSearchParams().get(CURVE_PARAM));
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
    // replaceState se integra con useSearchParams y no va al servidor.
    window.history.replaceState(null, "", `/orbitas${curveFilterSearch(next)}`);
  }

  return (
    <>
      <fieldset className="mt-6">
        <legend className="italic">Mostrar órbitas con</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          {CURVE_FILTERS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="curva"
                checked={filter === value}
                onChange={() => selectFilter(value)}
                className="size-4 accent-prussian"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <p role="status" className="mt-3 text-ink-soft">
        {visibleCards.length} de {cards.length} órbitas
      </p>
      <OrbitGrid cards={visibleCards} />
    </>
  );
}
