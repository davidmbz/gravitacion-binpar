import { integrateUniform } from "./dopri5";
import type { Orbit } from "./orbits";
import { POSITION_SIZE, STATE_SIZE, threeBodyDerivative } from "./three-body";

/** Tolerancia con la que `docs/orbitas.md` midió las órbitas. */
const TOLERANCE = 1e-13;

/** Con 4096 tramos, Hermite se desvía menos de 0,5 px en un canvas de 800 px. */
export const PLAYBACK_INTERVALS = 4096;

export interface OrbitSamples {
  /** Tiempo simulado que cubren las muestras: un periodo en una órbita cerrada. */
  duration: number;
  intervals: number;
  /** `intervals + 1` estados completos, separados por un tiempo constante. */
  states: Float64Array;
}

export function sampleState(
  initialState: readonly number[],
  duration: number,
  intervals: number,
): OrbitSamples {
  return {
    duration,
    intervals,
    states: integrateUniform({
      derivative: threeBodyDerivative,
      initialState,
      duration,
      intervals,
      tolerance: TOLERANCE,
    }),
  };
}

export function sampleOrbit(
  orbit: Orbit,
  intervals: number = PLAYBACK_INTERVALS,
): OrbitSamples {
  return sampleState(orbit.initialState, orbit.period, intervals);
}

/**
 * Escribe en `out` las posiciones en una fase de 0 a 1 de la duración.
 *
 * Interpola con Hermite cúbica porque en los encuentros cercanos un cuerpo gira
 * más entre dos muestras de lo que una recta puede seguir. Las velocidades
 * guardadas dan la tangente en cada extremo.
 */
export function positionsAt(
  { duration, intervals, states }: OrbitSamples,
  phase: number,
  out: Float64Array,
): void {
  const scaled = (phase - Math.floor(phase)) * intervals;
  const index = Math.min(Math.floor(scaled), intervals - 1);
  const u = scaled - index;
  const dt = duration / intervals;

  const start = index * STATE_SIZE;
  const end = start + STATE_SIZE;
  const u2 = u * u;
  const u3 = u2 * u;
  const startWeight = 2 * u3 - 3 * u2 + 1;
  const startTangent = (u3 - 2 * u2 + u) * dt;
  const endWeight = -2 * u3 + 3 * u2;
  const endTangent = (u3 - u2) * dt;

  for (let i = 0; i < POSITION_SIZE; i++) {
    out[i] =
      startWeight * states[start + i] +
      startTangent * states[start + POSITION_SIZE + i] +
      endWeight * states[end + i] +
      endTangent * states[end + POSITION_SIZE + i];
  }
}

/** Menor distancia entre dos cuerpos en los instantes muestreados. */
export function closestApproach({ states, intervals }: OrbitSamples): number {
  let closest = Infinity;
  for (let sample = 0; sample <= intervals; sample++) {
    const start = sample * STATE_SIZE;
    for (const [a, b] of [
      [0, 2],
      [0, 4],
      [2, 4],
    ]) {
      closest = Math.min(
        closest,
        Math.hypot(
          states[start + a] - states[start + b],
          states[start + a + 1] - states[start + b + 1],
        ),
      );
    }
  }
  return closest;
}

/**
 * Mayor distancia entre la posición inicial y final de un cuerpo. Mide el salto
 * visible al repetir el bucle. La velocidad no se incluye porque no se dibuja.
 */
export function positionClosure({ states, intervals }: OrbitSamples): number {
  const last = intervals * STATE_SIZE;
  let closure = 0;
  for (let i = 0; i < POSITION_SIZE; i += 2) {
    closure = Math.max(
      closure,
      Math.hypot(
        states[last + i] - states[i],
        states[last + i + 1] - states[i + 1],
      ),
    );
  }
  return closure;
}
