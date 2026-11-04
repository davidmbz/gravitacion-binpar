import { integrateUniform, type Derivative } from "./dopri5";

/**
 * Luna de masa despreciable alrededor de un planeta fijo, con G·M = 1. Se lanza
 * desde (0, 1): a esa altura, la velocidad de una órbita circular es 1.
 */
export const LAUNCH_RADIUS = 1;
export const PLANET_RADIUS = 0.5;

/**
 * Con estos límites, el momento angular nunca es nulo: ningún lanzamiento va
 * directo al centro del planeta, donde la fuerza divergiría.
 */
export const LAUNCH_LIMITS = {
  speed: { min: 0.4, max: 1.6, step: 0.1 },
  angle: { min: -60, max: 60, step: 10 },
} as const;

export type Launch = {
  /** Velocidad, en múltiplos de la de una órbita circular a esa altura. */
  speed: number;
  /** Grados sobre la horizontal: positivo hacia fuera del planeta. */
  angle: number;
};

export const INITIAL_LAUNCH: Launch = { speed: 0.7, angle: 0 };

/** Tiempo calculado: casi cinco vueltas de una órbita circular. */
export const FLIGHT_DURATION = 30;

/** Más allá ya no se ve: el vuelo termina al salir de la mesa. */
export const VIEW_LIMIT = 3.6;

const FLIGHT_INTERVALS = 2048;
const TOLERANCE = 1e-10;

export type LaunchOutcome =
  { kind: "orbit"; period: number } | { kind: "crash" } | { kind: "escape" };

export type MoonFlight = {
  outcome: LaunchOutcome;
  /** Pares x, y a tiempo uniforme, solo hasta el fin de la parte visible. */
  positions: Float64Array;
  /** Tiempo simulado que cubren las posiciones. */
  duration: number;
};

function initialState({ speed, angle }: Launch): number[] {
  const radians = (angle * Math.PI) / 180;
  return [
    0,
    LAUNCH_RADIUS,
    speed * Math.cos(radians),
    speed * Math.sin(radians),
  ];
}

const moonDerivative: Derivative = (state, out) => {
  const squared = state[0] ** 2 + state[1] ** 2;
  const cubed = squared * Math.sqrt(squared);
  out[0] = state[2];
  out[1] = state[3];
  out[2] = -state[0] / cubed;
  out[3] = -state[1] / cubed;
};

/**
 * Con dos cuerpos, energía y momento angular fijan la cónica sin integrar. Es
 * exacto y no depende de cuánto tiempo se calcule: detecta también un choque
 * que ocurriría después del tramo visible.
 */
export function classifyLaunch(launch: Launch): LaunchOutcome {
  const [x, y, vx, vy] = initialState(launch);
  const energy = (vx ** 2 + vy ** 2) / 2 - 1 / Math.hypot(x, y);
  const angularMomentum = x * vy - y * vx;
  const eccentricity = Math.sqrt(1 + 2 * energy * angularMomentum ** 2);
  const periapsis = angularMomentum ** 2 / (1 + eccentricity);

  if (energy >= 0) {
    // Una trayectoria abierta solo pasa por el periapsis si aún no lo ha pasado.
    const movingInward = launch.angle < 0;
    return movingInward && periapsis < PLANET_RADIUS
      ? { kind: "crash" }
      : { kind: "escape" };
  }

  if (periapsis < PLANET_RADIUS) return { kind: "crash" };

  const semiMajorAxis = -1 / (2 * energy);
  return { kind: "orbit", period: 2 * Math.PI * semiMajorAxis ** 1.5 };
}

/** Integra un tramo limitado y lo recorta donde deja de tener sentido verlo. */
export function simulateLaunch(launch: Launch): MoonFlight {
  const samples = integrateUniform({
    derivative: moonDerivative,
    initialState: initialState(launch),
    duration: FLIGHT_DURATION,
    intervals: FLIGHT_INTERVALS,
    tolerance: TOLERANCE,
  });

  const positions: number[] = [];
  let last = 0;
  for (let sample = 0; sample <= FLIGHT_INTERVALS; sample++) {
    const x = samples[sample * 4];
    const y = samples[sample * 4 + 1];
    const radius = Math.hypot(x, y);
    last = sample;
    if (radius < PLANET_RADIUS) {
      // El último punto queda sobre la superficie, no dentro del planeta.
      const scale = PLANET_RADIUS / radius;
      positions.push(x * scale, y * scale);
      break;
    }
    positions.push(x, y);
    if (radius > VIEW_LIMIT) break;
  }

  return {
    outcome: classifyLaunch(launch),
    positions: Float64Array.from(positions),
    duration: (last / FLIGHT_INTERVALS) * FLIGHT_DURATION,
  };
}
