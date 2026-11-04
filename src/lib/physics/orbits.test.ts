import { describe, expect, it } from "vitest";
import { ORBITS, findOrbit, type Orbit } from "./orbits";
import { positionClosure, positionsAt, sampleOrbit } from "./sampling";
import { POSITION_SIZE, STATE_SIZE, totalEnergy } from "./three-body";

const INTERVALS = 512;

/** Un canvas de 800 px cubre unas 2,6 unidades: 1e-3 son ~0,3 px, invisible. */
const VISUAL_CLOSURE = 1e-3;

/**
 * Límite de cierre por órbita. Las órbitas de catálogo se quedan en el límite
 * visual porque su error viene de los dígitos publicados, no del integrador.
 * Las dos primeras tienen más margen y se les exige más.
 */
const CLOSURE_LIMIT: Record<string, number> = {
  lagrange: 1e-10,
  "figura-de-ocho": 1e-6,
};

/** Unas 30 veces la deriva medida (3,4e-11): absorbe diferencias de plataforma. */
const ENERGY_DRIFT_LIMIT = 1e-9;

function energyDrift(states: Float64Array): number {
  const initial = totalEnergy(states.subarray(0, STATE_SIZE));
  let drift = 0;
  for (let sample = 1; sample <= INTERVALS; sample++) {
    const start = sample * STATE_SIZE;
    const state = states.subarray(start, start + STATE_SIZE);
    drift = Math.max(drift, Math.abs(totalEnergy(state) - initial));
  }
  return drift;
}

/**
 * Si los cuerpos comparten curva, cada uno ocupa un tercio de periodo después
 * el lugar de su vecino. El sentido depende de la órbita, así que vale el menor
 * de los dos desfases.
 */
function choreographyGap(orbit: Orbit): number {
  const { states } = sampleOrbit(orbit, 3 * INTERVALS);
  return Math.min(cyclicGap(states, 2), cyclicGap(states, 4));
}

function cyclicGap(states: Float64Array, bodyShift: number): number {
  let gap = 0;
  for (let sample = 0; sample <= 2 * INTERVALS; sample++) {
    const now = sample * STATE_SIZE;
    const later = (sample + INTERVALS) * STATE_SIZE;
    for (const body of [0, 2, 4]) {
      const neighbour = later + ((body + bodyShift) % POSITION_SIZE);
      gap = Math.max(
        gap,
        Math.hypot(
          states[neighbour] - states[now + body],
          states[neighbour + 1] - states[now + body + 1],
        ),
      );
    }
  }
  return gap;
}

describe.each(ORBITS.map((orbit) => [orbit.name, orbit] as const))(
  "%s",
  (_name, orbit) => {
    const samples = sampleOrbit(orbit, INTERVALS);
    const { states } = samples;

    it("tiene un estado completo", () => {
      expect(orbit.initialState).toHaveLength(STATE_SIZE);
    });

    it("cierra tras un periodo", () => {
      const limit = CLOSURE_LIMIT[orbit.slug] ?? VISUAL_CLOSURE;
      expect(positionClosure(samples)).toBeLessThan(limit);
    });

    it("conserva la energía", () => {
      expect(energyDrift(states)).toBeLessThan(ENERGY_DRIFT_LIMIT);
    });

    it("conserva el centro de masas y el momento nulo", () => {
      const last = INTERVALS * STATE_SIZE;
      for (const start of [last, last + POSITION_SIZE]) {
        expect(
          states[start] + states[start + 2] + states[start + 4],
        ).toBeCloseTo(0, 9);
        expect(
          states[start + 1] + states[start + 3] + states[start + 5],
        ).toBeCloseTo(0, 9);
      }
    });
  },
);

describe("curvas compartidas", () => {
  it.each(ORBITS.map((orbit) => [orbit.name, orbit] as const))(
    "%s está bien clasificada",
    (_name, orbit) => {
      const gap = choreographyGap(orbit);
      if (orbit.curve === "shared") {
        expect(gap).toBeLessThan(1e-6);
      } else {
        expect(gap).toBeGreaterThan(0.1);
      }
    },
  );
});

describe("Lagrange", () => {
  it("coincide con la rotación rígida exacta", () => {
    const orbit = findOrbit("lagrange");
    if (!orbit) throw new Error("Falta la órbita de Lagrange");
    const { states } = sampleOrbit(orbit, 12);

    for (let sample = 0; sample <= 12; sample++) {
      const angle = (2 * Math.PI * sample) / 12;
      expect(states[sample * STATE_SIZE]).toBeCloseTo(Math.cos(angle), 10);
      expect(states[sample * STATE_SIZE + 1]).toBeCloseTo(Math.sin(angle), 10);
    }
  });
});

describe("positionsAt", () => {
  const worstOrbits = ORBITS.filter((orbit) => orbit.curve === "separate");

  it.each(worstOrbits.map((orbit) => [orbit.name, orbit] as const))(
    "%s se reproduce con menos de 0,5 px de error a 800 px",
    (_name, orbit) => {
      const coarse = sampleOrbit(orbit);
      const factor = 4;
      const fine = sampleOrbit(orbit, coarse.intervals * factor);
      const out = new Float64Array(POSITION_SIZE);
      let worst = 0;

      for (let sample = 1; sample < fine.intervals; sample += 2) {
        positionsAt(coarse, sample / fine.intervals, out);
        for (let i = 0; i < POSITION_SIZE; i++) {
          worst = Math.max(
            worst,
            Math.abs(out[i] - fine.states[sample * STATE_SIZE + i]),
          );
        }
      }

      expect(worst).toBeLessThan((0.5 * 2.6) / 800);
    },
  );

  it("repite la órbita al superar una fase de 1", () => {
    const orbit = ORBITS[0];
    const samples = sampleOrbit(orbit, 64);
    const first = new Float64Array(POSITION_SIZE);
    const second = new Float64Array(POSITION_SIZE);
    positionsAt(samples, 0.3, first);
    positionsAt(samples, 1.3, second);
    second.forEach((value, i) => expect(value).toBeCloseTo(first[i], 12));
  });
});
