import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { BODY_COLORS } from "@/features/gallery/paint-orbit";
import { buildTrajectory, viewBoxOf } from "@/features/gallery/trajectory";
import { ORBITS, findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";

export const alt = "Trayectoria de una órbita de tres cuerpos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#eef0e8";
const INK = "#1b2233";
const INK_SOFT = "#4a5263";

/** Con este paso, el trazado cabe de sobra en el límite de 500 KB de la imagen. */
const IMAGE_MIN_STEP = 0.01;

const FIGURE_SIZE = 550;

export function generateStaticParams() {
  return ORBITS.map(({ slug }) => ({ slug }));
}

export default async function OrbitImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const orbit = findOrbit(slug);
  if (!orbit) notFound();

  const { frame, paths } = buildTrajectory(sampleOrbit(orbit), IMAGE_MIN_STEP);
  // Esta imagen no respeta la proporción del viewBox: la estiraría hasta llenar
  // el SVG. Por eso el SVG toma las proporciones de la órbita.
  const longestSide = Math.max(frame.width, frame.height);
  const figureWidth = (frame.width / longestSide) * FIGURE_SIZE;
  const figureHeight = (frame.height / longestSide) * FIGURE_SIZE;
  // El grosor va en unidades de la órbita, así se ve igual en todas.
  const strokeWidth = longestSide / 350;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 40,
        backgroundColor: PAPER,
        color: INK,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
        <div style={{ fontSize: 30, color: INK_SOFT }}>Gravitación</div>
        <div style={{ fontSize: 84, lineHeight: 1.1, marginTop: 16 }}>
          {orbit.name}
        </div>
        <div style={{ fontSize: 30, color: INK_SOFT, marginTop: 24 }}>
          Una órbita periódica de tres cuerpos
        </div>
      </div>
      <svg
        width={figureWidth}
        height={figureHeight}
        viewBox={viewBoxOf(frame)}
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, body) => (
          <path
            key={path}
            d={path}
            fill="none"
            stroke={BODY_COLORS[body]}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>,
    size,
  );
}
