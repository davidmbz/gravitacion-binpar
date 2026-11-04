import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const trajectory = buildTrajectory(
    samples,
    DETAIL_MIN_STEP,
    orbit.curve === "shared" ? 1 / 3 : 1,
  );
  const number = (value: number, digits: number) =>
    value.toLocaleString("es-ES", { maximumFractionDigits: digits });

  return (
    <OrbitPlayer
      slug={orbit.slug}
      frame={trajectory.frame}
      name={orbit.name}
      figure={
        <OrbitFigure
          trajectory={trajectory}
          tone="pigment"
          label={`Trayectoria de los tres cuerpos en ${orbit.name}. ${orbit.summary}`}
        />
      }
      about={
        <>
          <p className="text-lg leading-snug">{orbit.summary}</p>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            <div>
              <dt className="text-ink-soft">Periodo</dt>
              <dd className="text-xl">{number(orbit.period, 2)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Energía</dt>
              <dd className="text-xl">
                {number(totalEnergy(orbit.initialState), 2)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-soft">Mínima</dt>
              <dd className="text-xl">{number(closestApproach(samples), 3)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-ink-soft">
            Mínima es la menor distancia entre dos cuerpos. Todo va en unidades
            con G = 1 y masas iguales a 1.
          </p>
          <p className="mt-4">
            Fuente: <a href={orbit.source.url}>{orbit.source.label}</a>
          </p>
        </>
      }
      limits={
        <>
          <h2 className="text-xl">Lo que esta animación no es</h2>
          <p className="mt-2">
            No es una simulación infinita: se calcula un periodo al abrir la
            página y se repite en bucle. Tras ese periodo, los cuerpos quedan a
            una distancia de{" "}
            <ScientificNumber value={positionClosure(samples)} /> del punto de
            partida.
          </p>
          <p className="mt-3">{orbit.limitation}</p>
        </>
      }
    />
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
