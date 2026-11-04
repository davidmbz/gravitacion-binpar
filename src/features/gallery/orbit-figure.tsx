import { BODY_COLORS } from "./paint-orbit";
import { viewBoxOf, type Trajectory } from "./trajectory";

interface OrbitFigureProps {
  trajectory: Trajectory;
  label: string;
  tone: keyof typeof TONES;
}

/** La portada va en tinta; las láminas y el detalle, con el color de cada cuerpo. */
const TONES = {
  ink: { colored: false, opacity: 1, width: 1 },
  pigment: { colored: true, opacity: 0.55, width: 1.25 },
  vivid: { colored: true, opacity: 0.9, width: 1.5 },
};

/** Trayectoria estática. Se genera en el servidor y se ve sin JavaScript. */
export function OrbitFigure({ trajectory, label, tone }: OrbitFigureProps) {
  const { frame, paths } = trajectory;
  const { colored, opacity, width } = TONES[tone];

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
          stroke={colored ? BODY_COLORS[body] : "currentColor"}
          strokeOpacity={opacity}
          strokeWidth={width}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
