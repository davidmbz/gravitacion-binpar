import { describe, expect, it } from "vitest";
import { isRateLimited } from "./rate-limit";

describe("isRateLimited", () => {
  it("corta al superar diez peticiones en un minuto", () => {
    const results = Array.from({ length: 11 }, () =>
      isRateLimited("corta", 1_000),
    );
    expect(results.slice(0, 10)).not.toContain(true);
    expect(results[10]).toBe(true);
  });

  it("vuelve a permitir al terminar la ventana", () => {
    for (let i = 0; i < 11; i++) isRateLimited("ventana", 1_000);
    expect(isRateLimited("ventana", 61_000)).toBe(false);
  });

  it("cuenta cada clave por separado", () => {
    for (let i = 0; i < 11; i++) isRateLimited("una", 1_000);
    expect(isRateLimited("otra", 1_000)).toBe(false);
  });
});
