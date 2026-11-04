import { describe, expect, it } from "vitest";
import {
  areForcesVisible,
  currentPrediction,
  INITIAL_LEARN_STATE,
  learnReducer,
  type LearnState,
} from "./learn-reducer";
import { INITIAL_SCENE } from "./scene";

const answer = (state: LearnState, optionId = "cualquiera") =>
  learnReducer(state, { type: "answerPrediction", optionId });

const next = (state: LearnState) => learnReducer(state, { type: "nextStep" });

const previous = (state: LearnState) =>
  learnReducer(state, { type: "previousStep" });

describe("learnReducer", () => {
  it("fija la escena completa", () => {
    const scene = { massA: 1, massB: 9, distance: 7 };
    const state = learnReducer(INITIAL_LEARN_STATE, {
      type: "setScene",
      scene,
    });
    expect(state.scene).toEqual(scene);
  });

  it("guarda la respuesta del paso actual", () => {
    const state = answer(INITIAL_LEARN_STATE, "equal-and-opposite");
    expect(state.predictions.attraction).toEqual({
      status: "answered",
      optionId: "equal-and-opposite",
    });
    expect(state.predictions.mass).toEqual({ status: "pending" });
  });

  it("no deja cambiar una respuesta ya dada", () => {
    const state = answer(answer(INITIAL_LEARN_STATE, "primera"), "segunda");
    expect(state.predictions.attraction).toEqual({
      status: "answered",
      optionId: "primera",
    });
  });

  it("no avanza sin responder", () => {
    expect(next(INITIAL_LEARN_STATE)).toBe(INITIAL_LEARN_STATE);
  });

  it("avanza tras responder y vuelve a la escena inicial", () => {
    const moved = learnReducer(answer(INITIAL_LEARN_STATE), {
      type: "setScene",
      scene: { massA: 9, massB: 9, distance: 1 },
    });
    const state = next(moved);
    expect(state.stepIndex).toBe(1);
    expect(state.scene).toEqual(INITIAL_SCENE);
  });

  it("no pasa del último paso", () => {
    const last = answer(next(answer(next(answer(INITIAL_LEARN_STATE)))));
    expect(last.stepIndex).toBe(2);
    expect(next(last)).toBe(last);
  });

  it("retrocede conservando las respuestas", () => {
    const state = previous(next(answer(INITIAL_LEARN_STATE, "primera")));
    expect(state.stepIndex).toBe(0);
    expect(currentPrediction(state)).toEqual({
      status: "answered",
      optionId: "primera",
    });
  });

  it("no retrocede antes del primer paso", () => {
    expect(previous(INITIAL_LEARN_STATE)).toBe(INITIAL_LEARN_STATE);
  });
});

describe("areForcesVisible", () => {
  it("oculta las flechas hasta responder el primer paso", () => {
    expect(areForcesVisible(INITIAL_LEARN_STATE)).toBe(false);
    expect(areForcesVisible(answer(INITIAL_LEARN_STATE))).toBe(true);
  });

  it("las muestra en los pasos siguientes aunque estén sin responder", () => {
    const state = next(answer(INITIAL_LEARN_STATE));
    expect(currentPrediction(state).status).toBe("pending");
    expect(areForcesVisible(state)).toBe(true);
  });
});
