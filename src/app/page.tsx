import Link from "next/link";
import { OrbitFigure } from "@/features/gallery/orbit-figure";
import { buildTrajectory } from "@/features/gallery/trajectory";
import { findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";

const HERO_MIN_STEP = 0.01;

export default function HomePage() {
  const orbit = findOrbit("figura-de-ocho");
  if (!orbit) throw new Error("Falta la figura de ocho en el catálogo");

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:py-20">
      <div>
        <h1 className="text-4xl leading-tight sm:text-6xl">
          Dos cuerpos cualesquiera se atraen.
        </h1>
        <p className="mt-6 max-w-prose text-lg">
          Newton lo resumió en una sola ley. Compruébala moviendo masas con tus
          manos y mira después lo que ocurre cuando entra un tercer cuerpo.
        </p>
        <ul className="mt-8 flex flex-col gap-3 text-lg sm:flex-row sm:gap-8">
          <li>
            <Link href="/aprende">Aprender la ley</Link>
          </li>
          <li>
            <Link href="/orbitas">Ver las seis órbitas</Link>
          </li>
        </ul>
      </div>
      <figure className="-mt-16 lg:mt-0">
        <OrbitFigure
          trajectory={buildTrajectory(sampleOrbit(orbit), HERO_MIN_STEP)}
          label="Trayectoria en forma de ocho que recorren tres cuerpos"
        />
        <figcaption className="-mt-6 text-center text-ink-soft italic sm:-mt-12">
          Tres cuerpos iguales persiguiéndose por una misma curva.
        </figcaption>
      </figure>
    </div>
  );
}
