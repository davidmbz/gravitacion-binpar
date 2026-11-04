import { describe, expect, it } from "vitest";
import { ORBITS } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";
import { STATE_SIZE } from "@/lib/physics/three-body";
import { buildTrajectory, frameOf, unionFrames } from "./trajectory";

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

  it("une encuadres sin recortar ninguno", () => {
    const union = unionFrames(
      { x: -1, y: -1, width: 2, height: 2 },
      { x: 0, y: -3, width: 4, height: 1 },
    );
    expect(union).toEqual({ x: -1, y: -3, width: 5, height: 4 });
  });

  it("reduce puntos al aumentar la separación mínima", () => {
    const fine = buildTrajectory(samples, 0.005).paths[0];
    const coarse = buildTrajectory(samples, 0.05).paths[0];
    expect(coarse.length).toBeLessThan(fine.length);
  });

  it("dibuja solo la fracción pedida, con el mismo encuadre", () => {
    const full = buildTrajectory(samples, 0.02);
    const third = buildTrajectory(samples, 0.02, 1 / 3);
    expect(third.paths[0].length).toBeLessThan(full.paths[0].length);
    expect(third.frame).toEqual(full.frame);
  });

  it("un tercio de cada cuerpo completa una curva compartida", () => {
    const lagrange = sampleOrbit(ORBITS[0], 300);
    const { paths } = buildTrajectory(lagrange, 0, 1 / 3);
    const points = (path: string) =>
      path
        .slice(1)
        .split("L")
        .map((point) => point.split(" ").map(Number));
    const expectSamePoint = (a: number[] | undefined, b: number[]) => {
      expect(a?.[0]).toBeCloseTo(b[0], 2);
      expect(a?.[1]).toBeCloseTo(b[1], 2);
    };

    // Cada arco termina donde empieza el del cuerpo siguiente.
    const [first, second, third] = paths.map(points);
    expectSamePoint(first.at(-1), second[0]);
    expectSamePoint(second.at(-1), third[0]);
    expectSamePoint(third.at(-1), first[0]);
  });

  it("invierte el eje y para SVG", () => {
    const { paths } = buildTrajectory(sampleOrbit(ORBITS[0], 12), 0);
    // El cuerpo 2 de Lagrange empieza por encima del eje: y físico positivo.
    expect(paths[1].startsWith("M-0.500 -0.866")).toBe(true);
  });
});
