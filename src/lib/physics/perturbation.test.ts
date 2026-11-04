import { describe, expect, it } from "vitest";
import { ORBITS, findOrbit, type Orbit } from "./orbits";
import {
  compareWithPerturbed,
  COMPARISON_DURATION,
  PERTURBATION_SIZE,
  perturbedState,
  VISIBLE_SEPARATION,
} from "./perturbation";
import { POSITION_SIZE, totalEnergy } from "./three-body";

function orbitNamed(slug: string): Orbit {
  const orbit = findOrbit(slug);
  if (!orbit) throw new Error(`Falta la órbita ${slug}`);
  return orbit;
}

/** Margen sobre la deriva medida en un periodo: la comparación dura más. */
const ENERGY_DRIFT_LIMIT = 1e-8;

describe("perturbedState", () => {
  const initial = ORBITS[2].initialState;
  const perturbed = perturbedState(initial);

  it("no modifica el estado original", () => {
    expect(perturbed).not.toBe(initial);
    expect(initial[1]).toBe(0);
  });

  it("conserva el centro de masas y el momento", () => {
    const sum = (state: readonly number[], start: number) =>
      state[start] + state[start + 2] + state[start + 4];
    for (const start of [0, 1, POSITION_SIZE, POSITION_SIZE + 1]) {
      expect(sum(perturbed, start)).toBeCloseTo(sum(initial, start), 12);
    }
  });

  it("cambia la energía mucho menos que el tamaño de la perturbación", () => {
    const change = Math.abs(totalEnergy(perturbed) - totalEnergy(initial));
    expect(change).toBeLessThan(PERTURBATION_SIZE / 100);
  });
});

// Las entradas son fijas, así que este test garantiza que ningún usuario puede
// provocar un fallo del integrador con este botón.
describe.each(ORBITS.map((orbit) => [orbit.name, orbit] as const))(
  "%s",
  (_name, orbit) => {
    const comparison = compareWithPerturbed(orbit);

    it("termina y arranca separada justo la perturbación", () => {
      expect(comparison.separation[0]).toBeCloseTo(PERTURBATION_SIZE, 12);
      expect(comparison.perturbed.duration).toBe(COMPARISON_DURATION);
    });

    it("conserva la energía en la órbita perturbada", () => {
      const { states, intervals } = comparison.perturbed;
      const size = states.length / (intervals + 1);
      const initial = totalEnergy(states.subarray(0, size));
      const final = totalEnergy(states.subarray(intervals * size));
      expect(Math.abs(final - initial)).toBeLessThan(ENERGY_DRIFT_LIMIT);
    });
  },
);

describe("sensibilidad medida", () => {
  it("las órbitas inestables se separan a simple vista", () => {
    for (const slug of ["lagrange", "goggles"]) {
      const { visibleAt, peakSeparation } = compareWithPerturbed(
        orbitNamed(slug),
      );
      expect(visibleAt).not.toBeNull();
      expect(peakSeparation).toBeGreaterThan(5 * VISIBLE_SEPARATION);
    }
  });

  it("otras no llegan a separarse en este tiempo", () => {
    for (const slug of ["butterfly-i", "moth-i"]) {
      const { visibleAt } = compareWithPerturbed(orbitNamed(slug));
      expect(visibleAt).toBeNull();
    }
  });
});
