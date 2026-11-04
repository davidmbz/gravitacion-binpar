import { describe, expect, it } from "vitest";
import {
  curveFilterSearch,
  matchesFilter,
  parseCurveFilter,
} from "./curve-filter";

describe("parseCurveFilter", () => {
  it("reconoce los valores de la URL", () => {
    expect(parseCurveFilter("compartida")).toBe("shared");
    expect(parseCurveFilter("propia")).toBe("separate");
  });

  it("trata lo desconocido o ausente como todas", () => {
    expect(parseCurveFilter(null)).toBe("all");
    expect(parseCurveFilter("<script>")).toBe("all");
  });
});

describe("curveFilterSearch", () => {
  it("es la operación inversa de parseCurveFilter", () => {
    expect(curveFilterSearch("all")).toBe("");
    expect(curveFilterSearch("separate")).toBe("?curva=propia");
  });
});

describe("matchesFilter", () => {
  it("filtra por tipo de curva", () => {
    expect(matchesFilter("shared", "all")).toBe(true);
    expect(matchesFilter("shared", "separate")).toBe(false);
    expect(matchesFilter("separate", "separate")).toBe(true);
  });
});
