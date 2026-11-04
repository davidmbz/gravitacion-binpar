import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterableGallery } from "@/features/gallery/filterable-gallery";
import { OrbitCardLink } from "@/features/gallery/orbit-card-link";
import { OrbitFigure } from "@/features/gallery/orbit-figure";
import { OrbitGrid, type GalleryCard } from "@/features/gallery/orbit-grid";
import { buildTrajectory } from "@/features/gallery/trajectory";
import { ORBITS } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";

export const metadata: Metadata = { title: "Órbitas" };

const PLATE_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

/** Separación mínima entre puntos del trazado: ~2 px en una tarjeta de 300 px. */
const CARD_MIN_STEP = 0.02;

export default function GalleryPage() {
  const cards: GalleryCard[] = ORBITS.map((orbit, index) => {
    const trajectory = buildTrajectory(sampleOrbit(orbit), CARD_MIN_STEP);
    return {
      slug: orbit.slug,
      curve: orbit.curve,
      content: (
        <OrbitCardLink
          slug={orbit.slug}
          frame={trajectory.frame}
          figure={
            <OrbitFigure
              trajectory={trajectory}
              label={`Trayectoria de ${orbit.name}`}
            />
          }
        >
          <p className="mt-2 text-ink-soft italic">
            Lámina {PLATE_NUMERALS[index]}
          </p>
          <h2 className="text-xl underline decoration-transparent underline-offset-4 group-hover:decoration-current">
            {orbit.name}
          </h2>
        </OrbitCardLink>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl sm:text-4xl">Seis órbitas de tres cuerpos</h1>
      <p className="mt-3 max-w-prose">
        Tres masas iguales casi nunca repiten su camino. Estas son seis de las
        pocas configuraciones conocidas que sí lo hacen, al menos sobre el
        papel. Abre una para verla en movimiento.
      </p>
      <Suspense fallback={<OrbitGrid cards={cards} />}>
        <FilterableGallery cards={cards} />
      </Suspense>
    </div>
  );
}
