"use client";

import { CURVE_FILTERS, type CurveFilter } from "./curve-filter";

type GalleryControlsProps = {
  filter: CurveFilter;
  visibleCount: number;
  totalCount: number;
  /** Sin él, los controles se pintan inertes: es la reserva del prerender. */
  onSelect?: (filter: CurveFilter) => void;
};

export function GalleryControls({
  filter,
  visibleCount,
  totalCount,
  onSelect,
}: GalleryControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <fieldset disabled={!onSelect}>
        <legend className="sr-only">Mostrar órbitas por tipo de curva</legend>
        <div className="flex flex-wrap gap-0.5 rounded-md border border-rule p-1 sm:gap-1">
          {CURVE_FILTERS.map(({ value, label }) => (
            <label
              key={value}
              className="relative flex min-h-11 cursor-pointer items-center rounded px-2 transition-colors sm:px-3 duration-150 hover:bg-paper-deep has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-prussian lg:min-h-9"
            >
              <input
                type="radio"
                name="curva"
                checked={filter === value}
                onChange={() => onSelect?.(value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {/* El contador en vivo solo existe cuando la galería ya es interactiva. */}
      <p role={onSelect ? "status" : undefined} className="text-ink-soft">
        {visibleCount} de {totalCount} órbitas
      </p>
    </div>
  );
}
