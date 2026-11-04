import { describe, expect, it } from "vitest";
import { ORBITS } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";
import { STATE_SIZE } from "@/lib/physics/three-body";
import { buildTrajectory, frameOf, stageAspectRatio } from "./trajectory";

describe("buildTrajectory", () => {
  const samples = sampleOrbit(ORBITS[2], 1024);

  it("genera un trazado por cuerpo", () => {
    expect(buildTrajectory(samples, 0.02).paths).toHaveLength(3);
  });

  it("encuadra la órbita con margen en todos los lados", () => {
    const { frame } = buildTrajectory(samples, 0.02);
    for (let sample = 0; sample <= samples.intervals; sample++) {
      for (const body of [0, 1, 2]) {
        const x = samples.states[sample * STATE_SIZE + 2 * body];
        const y = -samples.states[sample * STATE_SIZE + 2 * body + 1];
        expect(x).toBeGreaterThan(frame.x);
        expect(x).toBeLessThan(frame.x + frame.width);
        expect(y).toBeGreaterThan(frame.y);
        expect(y).toBeLessThan(frame.y + frame.height);
      }
    }
  });

  it("se ajusta a la forma: Butterfly I es más ancha que alta", () => {
    const { width, height } = frameOf(samples);
    expect(width).toBeGreaterThan(height * 2);
  });

  it("limita la proporción del lienzo", () => {
    const frame = { x: 0, y: 0, width: 10, height: 1 };
    expect(stageAspectRatio(frame)).toBe(2);
    expect(stageAspectRatio({ ...frame, width: 1, height: 3 })).toBe(1);
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
