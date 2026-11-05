import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterableGallery } from "@/features/gallery/filterable-gallery";
import { OrbitCardLink } from "@/features/gallery/orbit-card-link";
import { OrbitFigure } from "@/features/gallery/orbit-figure";
import { GalleryControls } from "@/features/gallery/gallery-controls";
import { OrbitGrid, type GalleryCard } from "@/features/gallery/orbit-grid";
import { GALLERY_TILES, isWideFrame } from "@/features/gallery/tiles";
import { buildTrajectory } from "@/features/gallery/trajectory";
import { findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";

export const metadata: Metadata = { title: "Órbitas" };

/** Separación mínima entre puntos del trazado: ~2 px en una lámina de 300 px. */
const CARD_MIN_STEP = 0.02;

function buildCards(): GalleryCard[] {
  return GALLERY_TILES.map(({ slug, teaser }) => {
    const orbit = findOrbit(slug);
    if (!orbit) throw new Error(`Órbita desconocida: ${slug}`);

    const trajectory = buildTrajectory(
      sampleOrbit(orbit),
      CARD_MIN_STEP,
      orbit.curve === "shared" ? 1 / 3 : 1,
    );
    return {
      slug,
      curve: orbit.curve,
      isWide: isWideFrame(trajectory.frame),
      content: (
        <OrbitCardLink
          slug={slug}
          frame={trajectory.frame}
          figure={
            <OrbitFigure
              trajectory={trajectory}
              tone="vivid"
              label={`Trayectoria de ${orbit.name}`}
            />
          }
        >
          <h2 className="text-xl leading-tight lg:text-2xl">{orbit.name}</h2>
          <p className="leading-snug text-ink-soft lg:min-h-[2lh]">{teaser}</p>
        </OrbitCardLink>
      ),
    };
  });
}

export default function GalleryPage() {
  const cards = buildCards();
  const title = (
    // Con el ancho limitado, el filtro se queda a la derecha y no roba alto.
    <div className="lg:max-w-xl">
      <h1 className="text-3xl leading-tight">Seis órbitas de tres cuerpos</h1>
      <p className="mt-1 text-ink-soft">
        Tres cuerpos suelen acabar en caos. Estas seis órbitas son de las pocas
        excepciones: repiten su recorrido, al menos en teoría.
      </p>
    </div>
  );

  return (
    <div className="app-screen-desktop safe-bottom flex flex-col gap-3 px-4 pt-3 lg:px-6">
      <Suspense
        fallback={
          <>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              {title}
              <GalleryControls
                filter="all"
                visibleCount={cards.length}
                totalCount={cards.length}
              />
            </div>
            <OrbitGrid cards={cards} />
          </>
        }
      >
        <FilterableGallery title={title} cards={cards} />
      </Suspense>
    </div>
  );
}
