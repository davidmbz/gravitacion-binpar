import Link from "next/link";
import { OrbitFigure } from "@/features/gallery/orbit-figure";
import { buildTrajectory } from "@/features/gallery/trajectory";
import { OrbitHero } from "@/features/home/orbit-hero";
import { findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";

const HERO_MIN_STEP = 0.005;

export default function HomePage() {
  const orbit = findOrbit("figura-de-ocho");
  if (!orbit) throw new Error("Falta la figura de ocho en el catálogo");

  const trajectory = buildTrajectory(sampleOrbit(orbit), HERO_MIN_STEP);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:py-10">
      <OrbitHero slug={orbit.slug} frame={trajectory.frame}>
        <OrbitFigure
          trajectory={trajectory}
          label="Tres cuerpos iguales que se persiguen por una misma curva en forma de ocho"
        />
      </OrbitHero>

      <div className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-2 lg:gap-12">
        <h1 className="text-4xl leading-tight sm:text-6xl">
          Dos cuerpos cualesquiera se atraen.
        </h1>
        <div>
          <p className="max-w-prose text-lg">
            Newton lo resumió en una sola ley. Compruébala moviendo masas con
            tus manos y mira después lo que ocurre cuando entra un tercer
            cuerpo.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-lg">
            <Link
              href="/aprende"
              className="inline-flex min-h-12 items-center bg-prussian px-6 text-paper no-underline transition-colors duration-150 hover:bg-ink"
            >
              Aprender la ley
            </Link>
            <Link href="/orbitas">Ver las seis órbitas</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
