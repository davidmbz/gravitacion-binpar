import type { Trajectory } from "./trajectory";

interface OrbitFigureProps {
  trajectory: Trajectory;
  label: string;
}

/** Trayectoria estática. Se genera en el servidor y se ve sin JavaScript. */
export function OrbitFigure({ trajectory, label }: OrbitFigureProps) {
  const { halfSize, paths } = trajectory;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-halfSize} ${-halfSize} ${2 * halfSize} ${2 * halfSize}`}
      className="block aspect-square w-full"
    >
      {paths.map((path) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
