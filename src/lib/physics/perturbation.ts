import type { Orbit } from "./orbits";
import { sampleState, type OrbitSamples } from "./sampling";
import { POSITION_SIZE, STATE_SIZE } from "./three-body";

/** Una milésima: menos de medio píxel en un canvas de 800 px. */
export const PERTURBATION_SIZE = 1e-3;

/** Tiempo simulado de la comparación. Da de 1,7 a 4,8 periodos según la órbita. */
export const COMPARISON_DURATION = 30;

/** Mantiene el paso de tiempo de la reproducción normal, unas 0,004 unidades. */
const COMPARISON_INTERVALS = 8192;

/** A partir de aquí la diferencia se ve a simple vista: ~30 px a 800 px. */
export const VISIBLE_SEPARATION = 0.1;

export interface OrbitComparison {
  original: OrbitSamples;
  perturbed: OrbitSamples;
  /** Mayor distancia entre un cuerpo y su gemelo, en cada muestra. */
  separation: Float64Array;
  peakSeparation: number;
  /** Instante en que la separación se hace visible, o null si no llega. */
  visibleAt: number | null;
}

/**
 * Desplaza el cuerpo 1 hacia arriba y el 3 hacia abajo. Moverlos a la vez, en
 * sentidos opuestos, conserva el centro de masas: mover uno solo haría derivar
 * todo el sistema. Esta dirección apenas cambia la energía en la familia de
 * Šuvakov, así que la separación no es solo un cambio de periodo.
 */
export function perturbedState(initialState: readonly number[]): number[] {
  const state = [...initialState];
  state[1] += PERTURBATION_SIZE;
  state[5] -= PERTURBATION_SIZE;
  return state;
}

/** Integra original y perturbada con el mismo método y el mismo tiempo. */
export function compareWithPerturbed(orbit: Orbit): OrbitComparison {
  const original = sampleState(
    orbit.initialState,
    COMPARISON_DURATION,
    COMPARISON_INTERVALS,
  );
  const perturbed = sampleState(
    perturbedState(orbit.initialState),
    COMPARISON_DURATION,
    COMPARISON_INTERVALS,
  );

  const separation = new Float64Array(COMPARISON_INTERVALS + 1);
  let peakSeparation = 0;
  let visibleAt: number | null = null;

  for (let sample = 0; sample <= COMPARISON_INTERVALS; sample++) {
    const start = sample * STATE_SIZE;
    for (let i = 0; i < POSITION_SIZE; i += 2) {
      separation[sample] = Math.max(
        separation[sample],
        Math.hypot(
          perturbed.states[start + i] - original.states[start + i],
          perturbed.states[start + i + 1] - original.states[start + i + 1],
        ),
      );
    }
    peakSeparation = Math.max(peakSeparation, separation[sample]);
    if (visibleAt === null && separation[sample] > VISIBLE_SEPARATION) {
      visibleAt = (sample / COMPARISON_INTERVALS) * COMPARISON_DURATION;
    }
  }

  return { original, perturbed, separation, peakSeparation, visibleAt };
}
