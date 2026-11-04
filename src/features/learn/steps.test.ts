import { describe, expect, it } from "vitest";
import { INITIAL_SCENE, relativeForce } from "./scene";
import { gradePrediction, STEPS } from "./steps";

describe("STEPS", () => {
  it("sigue el orden atracción, masa, distancia", () => {
    expect(STEPS.map(({ id }) => id)).toEqual([
      "attraction",
      "mass",
      "distance",
    ]);
  });

  it.each(STEPS)("$id: la opción correcta existe", (step) => {
    expect(step.options.map(({ id }) => id)).toContain(step.correctOptionId);
  });

  it.each(STEPS)("$id: cada opción tiene su propia explicación", (step) => {
    const explanations = step.options.map(({ explanation }) => explanation);
    expect(new Set(explanations).size).toBe(step.options.length);
  });

  // Los textos citan números concretos: si cambia la escena inicial, este test
  // obliga a revisarlos.
  it("los textos coinciden con la escena inicial", () => {
    expect(INITIAL_SCENE).toEqual({ massA: 4, massB: 2, distance: 4 });
  });

  it("las respuestas correctas coinciden con la fórmula", () => {
    const [, mass, distance] = STEPS;
    expect(mass.correctOptionId).toBe("doubles");
    expect(relativeForce({ ...INITIAL_SCENE, massA: 8 })).toBe(2);
    expect(distance.correctOptionId).toBe("quarter");
    expect(relativeForce({ ...INITIAL_SCENE, distance: 8 })).toBe(0.25);
  });
});

describe("gradePrediction", () => {
  const [attraction] = STEPS;

  it("da por buena la opción correcta", () => {
    const result = gradePrediction(attraction, "equal-and-opposite");
    expect(result.isCorrect).toBe(true);
  });

  it("devuelve la explicación específica de la opción errónea", () => {
    const wrong = attraction.options[0];
    expect(gradePrediction(attraction, wrong.id)).toEqual({
      isCorrect: false,
      explanation: wrong.explanation,
    });
  });

  it("falla de forma explícita con una opción desconocida", () => {
    expect(() => gradePrediction(attraction, "inexistente")).toThrow();
  });
});
