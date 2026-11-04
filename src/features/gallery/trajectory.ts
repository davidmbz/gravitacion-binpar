import type { OrbitSamples } from "@/lib/physics/sampling";
import {
  BODY_COUNT,
  POSITION_SIZE,
  STATE_SIZE,
} from "@/lib/physics/three-body";

/** Rectángulo de encuadre en coordenadas SVG: el eje y crece hacia abajo. */
export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Trajectory {
  frame: Frame;
  /** Un trazado SVG por cuerpo. */
  paths: string[];
}

/** Margen alrededor de la órbita, para que los cuerpos no toquen el borde. */
const MARGIN_RATIO = 0.06;

/** Más ancha que esto, la figura dejaría unos controles demasiado cerca. */
const MAX_ASPECT_RATIO = 2;

/** Encuadre ajustado a la órbita: no todas ocupan un cuadrado. */
export function frameOf({ states, intervals }: OrbitSamples): Frame {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let sample = 0; sample <= intervals; sample++) {
    const start = sample * STATE_SIZE;
    for (let i = 0; i < POSITION_SIZE; i += 2) {
      minX = Math.min(minX, states[start + i]);
      maxX = Math.max(maxX, states[start + i]);
      minY = Math.min(minY, -states[start + i + 1]);
      maxY = Math.max(maxY, -states[start + i + 1]);
    }
  }

  const margin = Math.max(maxX - minX, maxY - minY) * MARGIN_RATIO;
  return {
    x: minX - margin,
    y: minY - margin,
    width: maxX - minX + 2 * margin,
    height: maxY - minY + 2 * margin,
  };
}

/** Proporción del lienzo: sigue a la órbita, sin llegar a una tira estrecha. */
export function stageAspectRatio({ width, height }: Frame): number {
  return Math.min(Math.max(width / height, 1), MAX_ASPECT_RATIO);
}

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

  return { frame: frameOf(samples), paths };
}
