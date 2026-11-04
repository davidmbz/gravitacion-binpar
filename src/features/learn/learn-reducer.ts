import { INITIAL_LAUNCH, type Launch } from "@/lib/physics/moon-launch";
import { INITIAL_SCENE, type Scene } from "./scene";
import type { Answers } from "./learner-profile";
import { STEPS, type StepId } from "./steps";

export type PredictionState =
  { status: "pending" } | { status: "answered"; optionId: string };

export type LearnState = {
  scene: Scene;
  launch: Launch;
  stepIndex: number;
  predictions: Record<StepId, PredictionState>;
};

export type LearnAction =
  | { type: "setScene"; scene: Scene }
  | { type: "setLaunch"; launch: Launch }
  | { type: "answerPrediction"; optionId: string }
  | { type: "nextStep" }
  | { type: "previousStep" };

export const INITIAL_LEARN_STATE: LearnState = {
  scene: INITIAL_SCENE,
  launch: INITIAL_LAUNCH,
  stepIndex: 0,
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
      const stepId = STEPS[state.stepIndex].id;
      return {
        ...state,
        predictions: {
          ...state.predictions,
          [stepId]: { status: "answered", optionId: action.optionId },
        },
      };
    }

    // Cada paso arranca en la escena inicial para que su pregunta y el ×1 de
    // referencia signifiquen lo mismo, venga la persona de donde venga.
    case "nextStep": {
      const isLastStep = state.stepIndex === STEPS.length - 1;
      if (isLastStep || currentPrediction(state).status === "pending") {
        return state;
      }
      return {
        ...state,
        scene: INITIAL_SCENE,
        launch: INITIAL_LAUNCH,
        stepIndex: state.stepIndex + 1,
      };
    }

    case "previousStep":
      if (state.stepIndex === 0) return state;
      return {
        ...state,
        scene: INITIAL_SCENE,
        launch: INITIAL_LAUNCH,
        stepIndex: state.stepIndex - 1,
      };
  }
}
