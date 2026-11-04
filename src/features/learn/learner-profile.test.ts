import { describe, expect, it } from "vitest";
import { TUTOR_LIMITS } from "@/lib/ai/schemas";
import { deriveProfile, suggestionsFor, type Answers } from "./learner-profile";
import { STEPS } from "./steps";

const noAnswers: Answers = { attraction: null, mass: null, distance: null };

describe("deriveProfile", () => {
  it("empieza vacío, sin revelar ningún concepto", () => {
    const profile = deriveProfile(noAnswers);
    expect(profile.concepts).toEqual([]);
    expect(profile.misconceptions).toEqual([]);
    expect(profile.pendingSteps).toEqual([
      "Atracción mutua",
      "Masa",
      "Distancia",
    ]);
  });

  it("marca como demostrado un acierto, sin registrar errores", () => {
    const profile = deriveProfile({
      ...noAnswers,
      attraction: "equal-and-opposite",
    });
    expect(profile.concepts).toEqual([
      expect.objectContaining({
        stepId: "attraction",
        status: "demonstrated",
      }),
    ]);
    expect(profile.misconceptions).toEqual([]);
  });

  it("marca por reforzar un fallo y nombra el error concreto", () => {
    const profile = deriveProfile({ ...noAnswers, distance: "half" });
    expect(profile.concepts[0].status).toBe("to-review");
    expect(profile.misconceptions).toEqual([
      "Creer que la fuerza baja en proporción directa a la distancia",
    ]);
  });

  it("no incluye el concepto de los pasos sin responder", () => {
    const profile = deriveProfile({ ...noAnswers, mass: "doubles" });
    const text = JSON.stringify(profile.concepts);
    expect(text).not.toContain("cuarto");
    expect(text).not.toContain("opuestas");
  });

  it("distingue el mismo identificador en pasos distintos", () => {
    const profile = deriveProfile({
      ...noAnswers,
      mass: "unchanged",
      distance: "unchanged",
    });
    expect(profile.misconceptions).toEqual([
      "Creer que la fuerza depende de una sola masa",
      "Creer que la distancia no afecta a la fuerza",
    ]);
  });
});

describe("catálogo de errores", () => {
  it.each(STEPS.map((step) => [step.title, step] as const))(
    "%s nombra un error en cada opción incorrecta y solo en ellas",
    (_title, step) => {
      for (const option of step.options) {
        if (option.id === step.correctOptionId) {
          expect(option.misconception).toBeUndefined();
        } else {
          expect(option.misconception).toBeDefined();
        }
      }
    },
  );
});

describe("suggestionsFor", () => {
  const [step] = STEPS;

  it("usa las preguntas neutras mientras no hay respuesta", () => {
    expect(suggestionsFor(step, null)).toEqual(step.tutorPrompts.pending);
  });

  it("no añade nada tras un acierto", () => {
    expect(suggestionsFor(step, step.correctOptionId)).toEqual(
      step.tutorPrompts.answered,
    );
  });

  it("apunta al error tras un fallo, dentro del límite del tutor", () => {
    for (const step of STEPS) {
      const wrong = step.options.filter(
        ({ id }) => id !== step.correctOptionId,
      );
      for (const option of wrong) {
        const [first] = suggestionsFor(step, option.id);
        expect(first).toContain(option.label);
        expect(first.length).toBeLessThanOrEqual(TUTOR_LIMITS.userMessageChars);
      }
    }
  });
});
