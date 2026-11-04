import { MISCONCEPTIONS, STEPS, type Step, type StepId } from "./steps";

/** Opción elegida en cada paso, o null si sigue pendiente. */
export type Answers = Record<StepId, string | null>;

export type ConceptResult = {
  stepId: StepId;
  title: string;
  concept: string;
  status: "demonstrated" | "to-review";
};

export type LearnerProfile = {
  /** Solo los pasos respondidos: mostrar los demás delataría su respuesta. */
  concepts: ConceptResult[];
  misconceptions: string[];
  pendingSteps: string[];
};

/**
 * Deriva el perfil de las respuestas. No se guarda aparte: así no puede
 * desincronizarse, y el servidor lo recalcula con esta misma función.
 */
export function deriveProfile(answers: Answers): LearnerProfile {
  const profile: LearnerProfile = {
    concepts: [],
    misconceptions: [],
    pendingSteps: [],
  };

  for (const step of STEPS) {
    const option = step.options.find(({ id }) => id === answers[step.id]);
    if (!option) {
      profile.pendingSteps.push(step.title);
      continue;
    }

    profile.concepts.push({
      stepId: step.id,
      title: step.title,
      concept: step.concept,
      status: option.id === step.correctOptionId ? "demonstrated" : "to-review",
    });
    if (option.misconception) {
      profile.misconceptions.push(MISCONCEPTIONS[option.misconception]);
    }
  }

  return profile;
}

/** Tras un error, la primera sugerencia apunta justo a esa respuesta. */
export function suggestionsFor(
  step: Step,
  answerId: string | null,
): readonly string[] {
  if (answerId === null) return step.tutorPrompts.pending;

  const option = step.options.find(({ id }) => id === answerId);
  if (!option?.misconception) return step.tutorPrompts.answered;

  return [
    `¿Por qué no es correcto: "${option.label}"?`,
    ...step.tutorPrompts.answered,
  ];
}
