import { maxExtent, type OrbitSamples } from "@/lib/physics/sampling";
import { BODY_COUNT, STATE_SIZE } from "@/lib/physics/three-body";

export interface Trajectory {
  /** Semilado del cuadrado que encuadra la órbita, en unidades físicas. */
  halfSize: number;
  /** Un trazado SVG por cuerpo. */
  paths: string[];
}

const MARGIN = 1.08;

/**
 * Convierte las muestras en trazados SVG. Solo conserva puntos separados al
 * menos `minStep`: los tramos lentos acumulan muestras que no se distinguen.
 * El eje y se invierte porque en SVG crece hacia abajo.
 */
export function buildTrajectory(
  samples: OrbitSamples,
  minStep: number,
): Trajectory {
  const paths: string[] = [];

  for (let body = 0; body < BODY_COUNT; body++) {
    const points: string[] = [];
    let lastX = Infinity;
    let lastY = Infinity;

    for (let sample = 0; sample <= samples.intervals; sample++) {
      const x = samples.states[sample * STATE_SIZE + 2 * body];
      const y = samples.states[sample * STATE_SIZE + 2 * body + 1];
      if (
        sample === samples.intervals ||
        Math.hypot(x - lastX, y - lastY) >= minStep
      ) {
        points.push(`${x.toFixed(3)} ${(-y).toFixed(3)}`);
        lastX = x;
        lastY = y;
      }
    }

    paths.push(`M${points.join("L")}`);
  }

  return { halfSize: maxExtent(samples) * MARGIN, paths };
}
