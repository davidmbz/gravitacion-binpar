import { describe, expect, it } from "vitest";
import { computeBand, computeLayout } from "./draw-table";
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

describe("computeBand", () => {
  // Tamaños reales de la mesa: móvil, móvil grande, móvil horizontal y escritorio.
  const TABLES = [
    [375, 210],
    [390, 318],
    [844, 163],
    [912, 672],
    [1072, 852],
  ] as const;

  const MAX_SCENE = {
    massA: SCENE_LIMITS.mass.max,
    massB: SCENE_LIMITS.mass.max,
    distance: 4,
  };

  it.each(TABLES)(
    "a %i × %i, cuerpos y etiquetas caben entre los textos y la regla",
    (width, height) => {
      const { top, axisY, ruleY, maxUnit } = computeBand(width, height);
      const { unit } = computeLayout(width, MAX_SCENE, maxUnit);
      // Mismo cálculo que drawTable: del cuerpo mayor al carril y a la etiqueta.
      const reach = 0.47 * 1.1 * unit + 16 + 14;

      expect(axisY - reach).toBeGreaterThanOrEqual(top);
      expect(axisY + reach).toBeLessThanOrEqual(ruleY);
    },
  );

  it("reserva la franja de textos solo en pantallas estrechas", () => {
    expect(computeBand(375, 210).top).toBeGreaterThan(0);
    expect(computeBand(1072, 852).top).toBe(0);
  });

  it("en una mesa baja manda el alto, y la distancia sigue a escala", () => {
    const { maxUnit } = computeBand(844, 163);
    const wide = computeLayout(844, MAX_SCENE);
    const limited = computeLayout(844, MAX_SCENE, maxUnit);
    expect(limited.unit).toBeLessThan(wide.unit);
    expect(limited.xB - limited.xA).toBeCloseTo(4 * limited.unit);
  });

  it("no cambia la mesa cuando hay alto de sobra", () => {
    const { maxUnit } = computeBand(1072, 852);
    expect(computeLayout(1072, MAX_SCENE, maxUnit).unit).toBe(
      computeLayout(1072, MAX_SCENE).unit,
    );
  });
});
