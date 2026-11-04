import { describe, expect, it } from "vitest";
import { ORBITS } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";
import { buildTrajectory } from "./trajectory";

describe("buildTrajectory", () => {
  const samples = sampleOrbit(ORBITS[2], 1024);

  it("genera un trazado por cuerpo con margen sobre la órbita", () => {
    const { paths, halfSize } = buildTrajectory(samples, 0.02);
    expect(paths).toHaveLength(3);
    expect(halfSize).toBeGreaterThan(1);
  });

  it("reduce puntos al aumentar la separación mínima", () => {
    const fine = buildTrajectory(samples, 0.005).paths[0];
    const coarse = buildTrajectory(samples, 0.05).paths[0];
    expect(coarse.length).toBeLessThan(fine.length);
  });

  it("invierte el eje y para SVG", () => {
    const { paths } = buildTrajectory(sampleOrbit(ORBITS[0], 12), 0);
    // El cuerpo 2 de Lagrange empieza por encima del eje: y físico positivo.
    expect(paths[1].startsWith("M-0.500 -0.866")).toBe(true);
  });
});
