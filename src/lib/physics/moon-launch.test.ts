import { describe, expect, it } from "vitest";
import {
  classifyLaunch,
  FLIGHT_DURATION,
  LAUNCH_LIMITS,
  LAUNCH_RADIUS,
  PLANET_RADIUS,
  simulateLaunch,
  VIEW_LIMIT,
  type Launch,
} from "./moon-launch";

function radiusAt(positions: Float64Array, point: number): number {
  return Math.hypot(positions[2 * point], positions[2 * point + 1]);
}

/** Todos los lanzamientos que permiten los controles. */
function allLaunches(): Launch[] {
  const { speed, angle } = LAUNCH_LIMITS;
  const launches: Launch[] = [];
  for (let s = speed.min; s <= speed.max + 1e-9; s += speed.step) {
    for (let a = angle.min; a <= angle.max; a += angle.step) {
      launches.push({ speed: Math.round(s * 10) / 10, angle: a });
    }
  }
  return launches;
}

describe("classifyLaunch", () => {
  it("la velocidad circular da una órbita de periodo 2π", () => {
    const outcome = classifyLaunch({ speed: 1, angle: 0 });
    expect(outcome.kind).toBe("orbit");
    if (outcome.kind === "orbit") {
      expect(outcome.period).toBeCloseTo(2 * Math.PI, 10);
    }
  });

  it("demasiado lento choca", () => {
    expect(classifyLaunch({ speed: 0.7, angle: 0 }).kind).toBe("crash");
  });

  it("la frontera de escape es √2 veces la circular", () => {
    expect(classifyLaunch({ speed: 1.4, angle: 0 }).kind).toBe("orbit");
    expect(classifyLaunch({ speed: 1.5, angle: 0 }).kind).toBe("escape");
  });

  it("escapa si va hacia fuera aunque la cónica corte el planeta", () => {
    expect(classifyLaunch({ speed: 1.6, angle: 60 }).kind).toBe("escape");
  });

  it("choca si va rápido pero directo hacia el planeta", () => {
    expect(classifyLaunch({ speed: 1.5, angle: -60 }).kind).toBe("crash");
  });

  it("detecta un choque posterior al tramo calculado", () => {
    const launch = { speed: 1.3, angle: 60 };
    expect(classifyLaunch(launch).kind).toBe("crash");
    const { positions } = simulateLaunch(launch);
    const last = positions.length / 2 - 1;
    expect(radiusAt(positions, last)).toBeGreaterThan(PLANET_RADIUS);
  });
});

// Dos caminos independientes: la fórmula cerrada y la integración numérica.
describe("DOPRI5 confirma la clasificación en todos los lanzamientos", () => {
  it.each(
    allLaunches().map(
      (launch) => [launch.speed, launch.angle, launch] as const,
    ),
  )("velocidad %d, ángulo %d", (_speed, _angle, launch) => {
    const { outcome, positions, duration } = simulateLaunch(launch);
    const points = positions.length / 2;
    const end = radiusAt(positions, points - 1);

    let lowest = Infinity;
    for (let point = 0; point < points; point++) {
      lowest = Math.min(lowest, radiusAt(positions, point));
    }
    expect(lowest).toBeGreaterThanOrEqual(PLANET_RADIUS - 1e-9);

    if (outcome.kind === "orbit") {
      expect(lowest).toBeGreaterThan(PLANET_RADIUS);
    }

    // Si el tramo acaba antes de tiempo, es por uno de los dos bordes.
    if (duration < FLIGHT_DURATION) {
      const hitPlanet = Math.abs(end - PLANET_RADIUS) < 1e-9;
      expect(hitPlanet || end > VIEW_LIMIT).toBe(true);
      if (hitPlanet) expect(outcome.kind).toBe("crash");
    }

    if (outcome.kind === "escape") {
      expect(end).toBeGreaterThan(VIEW_LIMIT);
    }
  });
});

describe("simulateLaunch", () => {
  it("la órbita circular mantiene el radio y vuelve al inicio", () => {
    const { positions } = simulateLaunch({ speed: 1, angle: 0 });
    for (let point = 0; point < positions.length / 2; point += 100) {
      expect(radiusAt(positions, point)).toBeCloseTo(LAUNCH_RADIUS, 6);
    }
  });

  it("parte siempre de lo alto de la mesa", () => {
    const { positions } = simulateLaunch({ speed: 0.9, angle: 20 });
    expect(positions[0]).toBe(0);
    expect(positions[1]).toBe(LAUNCH_RADIUS);
  });

  it("un choque termina justo en la superficie", () => {
    const { positions, duration } = simulateLaunch({ speed: 0.7, angle: 0 });
    const last = positions.length / 2 - 1;
    expect(radiusAt(positions, last)).toBeCloseTo(PLANET_RADIUS, 9);
    expect(duration).toBeLessThan(FLIGHT_DURATION);
  });
});
