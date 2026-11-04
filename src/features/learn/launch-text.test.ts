import { describe, expect, it } from "vitest";
import { describeOutcome, formatLaunch } from "./launch-text";

describe("describeOutcome", () => {
  it("da el periodo de una órbita cerrada", () => {
    const text = describeOutcome({ kind: "orbit", period: 6.283 });
    expect(text).toContain("Órbita:");
    expect(text).toContain("6,3");
  });

  it("no promete ver la vuelta de una órbita más larga que el tramo", () => {
    const text = describeOutcome({ kind: "orbit", period: 200 });
    expect(text).toContain("muy abierta");
    expect(text).not.toContain("200");
  });

  it("nombra el choque y el escape", () => {
    expect(describeOutcome({ kind: "crash" })).toContain("Choque");
    expect(describeOutcome({ kind: "escape" })).toContain("Escape");
  });
});

describe("formatLaunch", () => {
  it("usa coma decimal", () => {
    expect(formatLaunch({ speed: 0.7, angle: -20 })).toBe(
      "velocidad 0,7, ángulo -20 grados",
    );
  });
});
