import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryLink } from "@/features/gallery/gallery-link";
import { OrbitFigure } from "@/features/gallery/orbit-figure";
import { OrbitPlayer } from "@/features/gallery/orbit-player";
import { buildTrajectory } from "@/features/gallery/trajectory";
import { ORBITS, findOrbit } from "@/lib/physics/orbits";
import {
  closestApproach,
  positionClosure,
  sampleOrbit,
} from "@/lib/physics/sampling";
import { totalEnergy } from "@/lib/physics/three-body";

/** Separación mínima entre puntos del trazado: ~2 px en un canvas de 800 px. */
const DETAIL_MIN_STEP = 0.006;

export function generateStaticParams() {
  return ORBITS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/orbitas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const orbit = findOrbit(slug);
  if (!orbit) return {};
  return { title: orbit.name, description: orbit.summary };
}

export default async function OrbitPage({
  params,
}: PageProps<"/orbitas/[slug]">) {
  const { slug } = await params;
  const orbit = findOrbit(slug);
  if (!orbit) notFound();

  const samples = sampleOrbit(orbit);
  const trajectory = buildTrajectory(samples, DETAIL_MIN_STEP);
  const number = (value: number, digits: number) =>
    value.toLocaleString("es-ES", { maximumFractionDigits: digits });

  return (
    <article className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <GalleryLink>Volver a la galería</GalleryLink>
      <h1 className="mt-3 text-3xl sm:text-4xl">{orbit.name}</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <OrbitPlayer
          slug={orbit.slug}
          halfSize={trajectory.halfSize}
          name={orbit.name}
        >
          <OrbitFigure
            trajectory={trajectory}
            label={`Trayectoria de los tres cuerpos en ${orbit.name}. ${orbit.summary}`}
          />
        </OrbitPlayer>

        <div>
          <p className="text-lg">{orbit.summary}</p>

          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            <dt className="italic text-ink-soft">Periodo</dt>
            <dd>{number(orbit.period, 4)}</dd>
            <dt className="italic text-ink-soft">Energía total</dt>
            <dd>{number(totalEnergy(orbit.initialState), 4)}</dd>
            <dt className="italic text-ink-soft">Mayor acercamiento</dt>
            <dd>{number(closestApproach(samples), 3)}</dd>
          </dl>
          <p className="mt-2 text-ink-soft">
            En unidades con G = 1 y masas iguales a 1.
          </p>

          <h2 className="mt-8 text-xl">Lo que esta animación no es</h2>
          <p className="mt-2">
            No es una simulación infinita: se calcula un periodo al abrir la
            página y se repite en bucle. Tras ese periodo, los cuerpos quedan a
            una distancia de{" "}
            <ScientificNumber value={positionClosure(samples)} /> del punto de
            partida.
          </p>
          <p className="mt-2">{orbit.limitation}</p>
          <p className="mt-3">
            Fuente: <a href={orbit.source.url}>{orbit.source.label}</a>
          </p>
        </div>
      </div>
    </article>
  );
}

/** Potencia de diez con superíndice real: 5 × 10⁻⁴ se lee mejor que 5e-4. */
function ScientificNumber({ value }: { value: number }) {
  const exponent = Math.floor(Math.log10(value));
  const mantissa = Math.round(value / 10 ** exponent);
  return (
    <>
      {mantissa} × 10<sup>{exponent}</sup>
    </>
  );
}
