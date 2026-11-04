import { INITIAL_LAUNCH, type Launch } from "@/lib/physics/moon-launch";
import { INITIAL_SCENE, type Scene } from "./scene";
import type { Answers } from "./learner-profile";
import { STEPS, type StepId } from "./steps";

export type PredictionState =
  { status: "pending" } | { status: "answered"; optionId: string };

/** Solo una fase a la vez. `closing` es el cierre, tras el último paso. */
export type LearnPhase = "predict" | "result" | "explore" | "closing";

export type LearnState = {
  scene: Scene;
  launch: Launch;
  stepIndex: number;
  phase: LearnPhase;
  predictions: Record<StepId, PredictionState>;
};

export type LearnAction =
  | { type: "setScene"; scene: Scene }
  | { type: "setLaunch"; launch: Launch }
  | { type: "answerPrediction"; optionId: string }
  | { type: "startExploring" }
  | { type: "nextStep" }
  | { type: "previousStep" }
  | { type: "finish" }
  | { type: "review" };

export const INITIAL_LEARN_STATE: LearnState = {
  scene: INITIAL_SCENE,
  launch: INITIAL_LAUNCH,
  stepIndex: 0,
  phase: "predict",
  predictions: {
    attraction: { status: "pending" },
    mass: { status: "pending" },
    distance: { status: "pending" },
    orbit: { status: "pending" },
  },
};

/** Identificadores de las respuestas: lo único que necesita saber el servidor. */
export function answersOf({ predictions }: LearnState): Answers {
  const answer = (prediction: PredictionState) =>
    prediction.status === "answered" ? prediction.optionId : null;
  return {
    attraction: answer(predictions.attraction),
    mass: answer(predictions.mass),
    distance: answer(predictions.distance),
    orbit: answer(predictions.orbit),
  };
}

export function currentPrediction(state: LearnState): PredictionState {
  return state.predictions[STEPS[state.stepIndex].id];
}

// Solo el primer paso oculta las flechas: su pregunta es justo cómo son. En los
// demás, la pregunta trata de un cambio que aún no se puede hacer.
export function areForcesVisible(state: LearnState): boolean {
  return state.stepIndex > 0 || currentPrediction(state).status === "answered";
}

/** Lanzamiento que se muestra como ejemplo al revelar el último paso. */
export const EXAMPLE_LAUNCH: Launch = { speed: 1, angle: 0 };

/** Al llegar a un paso ya respondido no se repite la predicción. */
function enterStep(state: LearnState, stepIndex: number): LearnState {
  const isAnswered =
    state.predictions[STEPS[stepIndex].id].status === "answered";
  return {
    ...state,
    scene: INITIAL_SCENE,
    launch: INITIAL_LAUNCH,
    stepIndex,
    phase: isAnswered ? "explore" : "predict",
  };
}

export function learnReducer(
  state: LearnState,
  action: LearnAction,
): LearnState {
  switch (action.type) {
    case "setScene":
      return { ...state, scene: action.scene };

    case "setLaunch":
      return { ...state, launch: action.launch };

    case "answerPrediction": {
      if (currentPrediction(state).status === "answered") return state;
      const step = STEPS[state.stepIndex];
      return {
        ...state,
        phase: "result",
        // El resultado se ve en la mesa: se aplica el cambio por el que se preguntó.
        scene: step.demonstration ?? state.scene,
        launch: step.id === "orbit" ? EXAMPLE_LAUNCH : state.launch,
        predictions: {
          ...state.predictions,
          [step.id]: { status: "answered", optionId: action.optionId },
        },
      };
    }

    // Explorar arranca en la escena inicial para que ×1 signifique lo mismo.
    case "startExploring":
      if (state.phase !== "result") return state;
      return {
        ...state,
        phase: "explore",
        scene: INITIAL_SCENE,
        launch: INITIAL_LAUNCH,
      };

    case "nextStep": {
      const isLastStep = state.stepIndex === STEPS.length - 1;
      if (isLastStep || currentPrediction(state).status === "pending") {
        return state;
      }
      return enterStep(state, state.stepIndex + 1);
    }

    case "previousStep":
      if (state.stepIndex === 0) return state;
      return enterStep(state, state.stepIndex - 1);

    case "finish": {
      const isLastStep = state.stepIndex === STEPS.length - 1;
      if (!isLastStep || currentPrediction(state).status === "pending") {
        return state;
      }
      return { ...state, phase: "closing" };
    }

    case "review":
      return state.phase === "closing"
        ? enterStep(state, state.stepIndex)
        : state;
  }
}
