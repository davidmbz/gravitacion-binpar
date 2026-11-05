import { describe, expect, it } from "vitest";
import type { OrbitComparison } from "@/lib/physics/perturbation";
import { describeComparison, formatSeparation } from "./comparison-text";

function comparison(
  peakSeparation: number,
  visibleAt: number | null,
): OrbitComparison {
  const samples = { duration: 30, intervals: 1, states: new Float64Array() };
  return {
    original: samples,
    perturbed: samples,
    separation: new Float64Array(),
    peakSeparation,
    visibleAt,
  };
}

describe("describeComparison", () => {
  it("cuenta cuándo se hizo visible", () => {
    const text = describeComparison(comparison(0.109, 29.3));
    expect(text).toBe(
      "Bastó mover dos cuerpos 0,001 unidades: en el instante 29,3 la separación ya era 100 veces mayor, y llegó a 0,11.",
    );
  });

  it("mantiene las cifras con otra órbita", () => {
    const text = describeComparison(comparison(2.97, 10.84));
    expect(text).toContain("instante 10,8");
    expect(text).toContain("100 veces");
    expect(text).toContain("2,97");
  });

  it("no exagera si no llega a verse", () => {
    const text = describeComparison(comparison(0.052, null));
    expect(text).toContain("no pasó de 0,05");
    expect(text).toContain("0,001 unidades");
    expect(text).not.toContain("veces");
    expect(text).not.toContain("Bastó");
  });
});

describe("formatSeparation", () => {
  it("no da falsa precisión con valores minúsculos", () => {
    expect(formatSeparation(0.001)).toBe("menos de 0,01");
  });
});
