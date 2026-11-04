import { describe, expect, it } from "vitest";
import { computeLayout } from "./draw-table";
import { INITIAL_SCENE, SCENE_LIMITS } from "./scene";

const MOBILE_WIDTH = 340;

describe("computeLayout", () => {
  it("mantiene la distancia a escala real", () => {
    const near = computeLayout(MOBILE_WIDTH, { ...INITIAL_SCENE, distance: 2 });
    const far = computeLayout(MOBILE_WIDTH, { ...INITIAL_SCENE, distance: 4 });
    expect(far.xB - far.xA).toBeCloseTo(2 * (near.xB - near.xA));
  });

  it("no solapa dos cuerpos de masa máxima a la distancia mínima", () => {
    const { xA, xB, radiusA, halfDiagonalB } = computeLayout(MOBILE_WIDTH, {
      massA: SCENE_LIMITS.mass.max,
      massB: SCENE_LIMITS.mass.max,
      distance: SCENE_LIMITS.distance.min,
    });
    expect(xA + radiusA).toBeLessThan(xB - halfDiagonalB);
  });

  it("deja los cuerpos dentro de la mesa a la distancia máxima", () => {
    const { xA, xB, radiusA, halfDiagonalB } = computeLayout(MOBILE_WIDTH, {
      massA: SCENE_LIMITS.mass.max,
      massB: SCENE_LIMITS.mass.max,
      distance: SCENE_LIMITS.distance.max,
    });
    expect(xA - radiusA).toBeGreaterThan(0);
    expect(xB + halfDiagonalB).toBeLessThan(MOBILE_WIDTH);
  });

  it("dibuja ×4 cuatro veces más largo que ×1", () => {
    const reference = computeLayout(MOBILE_WIDTH, INITIAL_SCENE).arrow;
    const fourTimes = computeLayout(MOBILE_WIDTH, {
      ...INITIAL_SCENE,
      distance: INITIAL_SCENE.distance / 2,
    }).arrow;
    expect(fourTimes.length).toBeCloseTo(4 * reference.length);
    expect(fourTimes.isClipped).toBe(false);
  });

  it("recorta la flecha y lo indica cuando no cabe", () => {
    const { arrow, xA, unit } = computeLayout(MOBILE_WIDTH, {
      massA: SCENE_LIMITS.mass.max,
      massB: SCENE_LIMITS.mass.max,
      distance: SCENE_LIMITS.distance.min,
    });
    expect(arrow.isClipped).toBe(true);
    expect(xA + arrow.length).toBeLessThanOrEqual(MOBILE_WIDTH - unit);
  });

  it("mantiene visible la flecha de la fuerza mínima", () => {
    const { arrow } = computeLayout(MOBILE_WIDTH, {
      massA: SCENE_LIMITS.mass.min,
      massB: SCENE_LIMITS.mass.min,
      distance: SCENE_LIMITS.distance.max,
    });
    expect(arrow.length).toBeGreaterThanOrEqual(5);
  });
});
