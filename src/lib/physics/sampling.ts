import { integrateUniform } from "./dopri5";
import type { Orbit } from "./orbits";
import { POSITION_SIZE, STATE_SIZE, threeBodyDerivative } from "./three-body";

/** Tolerancia con la que `docs/orbitas.md` midió las órbitas. */
const TOLERANCE = 1e-13;

/** Con 4096 tramos, Hermite se desvía menos de 0,4 px en un canvas de 800 px. */
export const PLAYBACK_INTERVALS = 4096;

export interface OrbitSamples {
  period: number;
  intervals: number;
  /** `intervals + 1` estados completos, separados por un tiempo constante. */
  states: Float64Array;
}

export function sampleOrbit(
  orbit: Orbit,
  intervals: number = PLAYBACK_INTERVALS,
): OrbitSamples {
  return {
    period: orbit.period,
    intervals,
    states: integrateUniform({
      derivative: threeBodyDerivative,
      initialState: orbit.initialState,
      duration: orbit.period,
      intervals,
      tolerance: TOLERANCE,
    }),
  };
}

/**
 * Escribe en `out` las posiciones en una fase de 0 a 1 del periodo.
 *
 * Interpola con Hermite cúbica porque en los encuentros cercanos un cuerpo gira
 * más entre dos muestras de lo que una recta puede seguir. Las velocidades
 * guardadas dan la tangente en cada extremo.
 */
export function positionsAt(
  { period, intervals, states }: OrbitSamples,
  phase: number,
  out: Float64Array,
): void {
  const scaled = (phase - Math.floor(phase)) * intervals;
  const index = Math.min(Math.floor(scaled), intervals - 1);
  const u = scaled - index;
  const dt = period / intervals;

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

/** Mayor coordenada absoluta alcanzada: sirve para encuadrar la órbita. */
export function maxExtent({ states, intervals }: OrbitSamples): number {
  let extent = 0;
  for (let sample = 0; sample <= intervals; sample++) {
    for (let i = 0; i < POSITION_SIZE; i++) {
      extent = Math.max(extent, Math.abs(states[sample * STATE_SIZE + i]));
    }
  }
  return extent;
}
