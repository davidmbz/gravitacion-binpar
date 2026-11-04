/**
 * Estado plano de tres cuerpos en el plano, con G = 1 y masas iguales a 1:
 * [x1, y1, x2, y2, x3, y3, vx1, vy1, vx2, vy2, vx3, vy3].
 */
export const BODY_COUNT = 3;
export const POSITION_SIZE = BODY_COUNT * 2;
export const STATE_SIZE = POSITION_SIZE * 2;

export function threeBodyDerivative(
  state: Float64Array,
  out: Float64Array,
): void {
  for (let i = 0; i < POSITION_SIZE; i++) {
    out[i] = state[POSITION_SIZE + i];
    out[POSITION_SIZE + i] = 0;
  }

  for (let a = 0; a < BODY_COUNT; a++) {
    for (let b = a + 1; b < BODY_COUNT; b++) {
      const dx = state[2 * b] - state[2 * a];
      const dy = state[2 * b + 1] - state[2 * a + 1];
      const squared = dx * dx + dy * dy;
      const cubed = squared * Math.sqrt(squared);
      // Ley de Newton: |a| = 1/r², dirigida hacia el otro cuerpo.
      const ax = dx / cubed;
      const ay = dy / cubed;
      out[POSITION_SIZE + 2 * a] += ax;
      out[POSITION_SIZE + 2 * a + 1] += ay;
      out[POSITION_SIZE + 2 * b] -= ax;
      out[POSITION_SIZE + 2 * b + 1] -= ay;
    }
  }
}

/** Energía total: cinética más potencial gravitatoria de cada pareja. */
export function totalEnergy(state: ArrayLike<number>): number {
  let kinetic = 0;
  for (let i = POSITION_SIZE; i < STATE_SIZE; i++) {
    kinetic += 0.5 * state[i] ** 2;
  }

  let potential = 0;
  for (let a = 0; a < BODY_COUNT; a++) {
    for (let b = a + 1; b < BODY_COUNT; b++) {
      potential -=
        1 /
        Math.hypot(
          state[2 * b] - state[2 * a],
          state[2 * b + 1] - state[2 * a + 1],
        );
    }
  }

  return kinetic + potential;
}
