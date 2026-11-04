import { describe, expect, it } from "vitest";
import { integrateUniform, type Derivative } from "./dopri5";

const oscillator: Derivative = (state, out) => {
  out[0] = state[1];
  out[1] = -state[0];
};

function finalError(tolerance: number): number {
  const samples = integrateUniform({
    derivative: oscillator,
    initialState: [1, 0],
    duration: 2 * Math.PI,
    intervals: 1,
    tolerance,
  });
  return Math.abs(samples[2] - 1);
}

describe("integrateUniform", () => {
  it("sigue la solución exacta del oscilador armónico", () => {
    const samples = integrateUniform({
      derivative: oscillator,
      initialState: [1, 0],
      duration: Math.PI,
      intervals: 4,
      tolerance: 1e-12,
    });
    for (let k = 0; k <= 4; k++) {
      const t = (k / 4) * Math.PI;
      expect(samples[2 * k]).toBeCloseTo(Math.cos(t), 9);
      expect(samples[2 * k + 1]).toBeCloseTo(-Math.sin(t), 9);
    }
  });

  it("reduce el error al apretar la tolerancia", () => {
    expect(finalError(1e-12)).toBeLessThan(finalError(1e-8) / 100);
  });

  it("falla de forma explícita ante una singularidad", () => {
    const collapse: Derivative = (state, out) => {
      out[0] = -1 / state[0] ** 3;
    };
    expect(() =>
      integrateUniform({
        derivative: collapse,
        initialState: [1],
        duration: 10,
        intervals: 1,
        tolerance: 1e-10,
      }),
    ).toThrow(/mínimo/);
  });
});
