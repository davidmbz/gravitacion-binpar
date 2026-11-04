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
    const text = describeComparison(comparison(2.97, 10.84));
    expect(text).toContain("instante 10,8");
    expect(text).toContain("100 veces");
    expect(text).toContain("2,97");
  });

  it("no exagera si no llega a verse", () => {
    const text = describeComparison(comparison(0.052, null));
    expect(text).toContain("no pasó de 0,05");
    expect(text).not.toContain("veces");
  });
});

describe("formatSeparation", () => {
  it("no da falsa precisión con valores minúsculos", () => {
    expect(formatSeparation(0.001)).toBe("menos de 0,01");
  });
});
