import { BODY_COLORS } from "./paint-orbit";
import { viewBoxOf, type Trajectory } from "./trajectory";

interface OrbitFigureProps {
  trajectory: Trajectory;
  label: string;
  /** Tinta para las láminas; pigmentos para distinguir cada cuerpo. */
  tone?: "ink" | "pigment";
}

/** Trayectoria estática. Se genera en el servidor y se ve sin JavaScript. */
export function OrbitFigure({
  trajectory,
  label,
  tone = "ink",
}: OrbitFigureProps) {
  const { frame, paths } = trajectory;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={viewBoxOf(frame)}
      className="block size-full"
    >
      {paths.map((path, body) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke={tone === "pigment" ? BODY_COLORS[body] : "currentColor"}
          strokeOpacity={tone === "pigment" ? 0.55 : 1}
          strokeWidth={tone === "pigment" ? 1.25 : 1}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
