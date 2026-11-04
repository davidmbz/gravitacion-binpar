/** Escribe en `out` la derivada del estado. Evita reservar memoria en cada evaluación. */
export type Derivative = (state: Float64Array, out: Float64Array) => void;

interface UniformIntegration {
  derivative: Derivative;
  initialState: ArrayLike<number>;
  duration: number;
  /** Número de tramos iguales: el resultado tiene `intervals + 1` estados. */
  intervals: number;
  tolerance: number;
}

// Tablero de Dormand-Prince 5(4). Los pesos de la solución coinciden con la
// última fila de A, así que la séptima etapa se reutiliza como primera del
// paso siguiente.
const A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
];

// Diferencia entre las soluciones de orden 5 y 4: estima el error del paso.
const ERROR_WEIGHTS = [
  71 / 57600,
  0,
  -71 / 16695,
  71 / 1920,
  -17253 / 339200,
  22 / 525,
  -1 / 40,
];

const STAGES = 7;
const INITIAL_STEP = 1e-3;
const MIN_STEP = 1e-13;
const SAFETY = 0.9;
const MIN_GROWTH = 0.2;
const MAX_GROWTH = 5;

/**
 * Integra con paso adaptativo y devuelve estados a intervalos de tiempo iguales.
 *
 * El paso se recorta para caer justo en cada instante de muestreo. Así la
 * animación tiene velocidad constante sin interpolar entre pasos irregulares.
 */
export function integrateUniform({
  derivative,
  initialState,
  duration,
  intervals,
  tolerance,
}: UniformIntegration): Float64Array {
  const size = initialState.length;
  const samples = new Float64Array((intervals + 1) * size);
  samples.set(Array.from(initialState));

  let current = Float64Array.from(initialState);
  let next = new Float64Array(size);
  const stages = Array.from({ length: STAGES }, () => new Float64Array(size));
  const stageState = new Float64Array(size);

  let time = 0;
  let step = INITIAL_STEP;
  derivative(current, stages[0]);

  for (let sample = 1; sample <= intervals; sample++) {
    const target = (sample / intervals) * duration;

    while (time < target) {
      const remaining = target - time;
      const clipped = step >= remaining;
      const usedStep = clipped ? remaining : step;

      for (let stage = 1; stage < STAGES; stage++) {
        const row = A[stage];
        // La última etapa se evalúa en la solución candidata.
        const destination = stage === STAGES - 1 ? next : stageState;
        for (let i = 0; i < size; i++) {
          let increment = 0;
          for (let j = 0; j < stage; j++) {
            increment += row[j] * stages[j][i];
          }
          destination[i] = current[i] + usedStep * increment;
        }
        derivative(destination, stages[stage]);
      }

      const error = scaledError(current, next, stages, usedStep, tolerance);

      if (error <= 1) {
        time = clipped ? target : time + usedStep;
        [current, next] = [next, current];
        stages[0].set(stages[STAGES - 1]);
      }

      // Un paso recortado no dice nada del tamaño ideal: si se acepta, se
      // conserva el anterior para no frenar tras cada muestra.
      if (!clipped || error > 1) {
        step = usedStep * growthFactor(error);
      }

      if (step < MIN_STEP) {
        throw new Error(`Paso por debajo del mínimo en t = ${time}`);
      }
    }

    samples.set(current, sample * size);
  }

  return samples;
}

function scaledError(
  current: Float64Array,
  next: Float64Array,
  stages: Float64Array[],
  step: number,
  tolerance: number,
): number {
  let sum = 0;
  for (let i = 0; i < current.length; i++) {
    let difference = 0;
    for (let stage = 0; stage < STAGES; stage++) {
      difference += ERROR_WEIGHTS[stage] * stages[stage][i];
    }
    const scale =
      tolerance + tolerance * Math.max(Math.abs(current[i]), Math.abs(next[i]));
    sum += ((step * difference) / scale) ** 2;
  }
  return Math.sqrt(sum / current.length);
}

function growthFactor(error: number): number {
  if (error === 0) return MAX_GROWTH;
  return Math.min(MAX_GROWTH, Math.max(MIN_GROWTH, SAFETY * error ** -0.2));
}
