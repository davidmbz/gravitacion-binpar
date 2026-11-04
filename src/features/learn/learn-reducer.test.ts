import { INITIAL_LAUNCH } from "@/lib/physics/moon-launch";
import { STEPS } from "./steps";
import { describe, expect, it } from "vitest";
import {
  EXAMPLE_LAUNCH,
  areForcesVisible,
  currentPrediction,
  INITIAL_LEARN_STATE,
  learnReducer,
  type LearnState,
} from "./learn-reducer";
import { INITIAL_SCENE, relativeForce } from "./scene";

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

  it("cambiar de paso devuelve el lanzamiento al inicial", () => {
    const launch = { speed: 1.5, angle: 20 };
    const state = learnReducer(answer(INITIAL_LEARN_STATE), {
      type: "setLaunch",
      launch,
    });
    expect(state.launch).toEqual(launch);
    expect(next(state).launch).toEqual(INITIAL_LAUNCH);
  });

  it("empieza prediciendo y responder lleva al resultado", () => {
    expect(INITIAL_LEARN_STATE.phase).toBe("predict");
    expect(answer(INITIAL_LEARN_STATE).phase).toBe("result");
  });

  it("aplica en la mesa el cambio por el que se preguntó", () => {
    const massStep = next(answer(INITIAL_LEARN_STATE));
    const state = answer(massStep, "doubles");
    expect(relativeForce(state.scene)).toBe(2);
  });

  it("la distancia se demuestra con un cuarto de la fuerza", () => {
    const distanceStep = next(answer(next(answer(INITIAL_LEARN_STATE))));
    expect(relativeForce(answer(distanceStep, "quarter").scene)).toBe(0.25);
  });

  it("el último paso enseña un lanzamiento de ejemplo", () => {
    const orbitStep = next(
      answer(next(answer(next(answer(INITIAL_LEARN_STATE))))),
    );
    expect(answer(orbitStep).launch).toEqual(EXAMPLE_LAUNCH);
  });

  it("explorar vuelve a la escena inicial", () => {
    const massStep = next(answer(INITIAL_LEARN_STATE));
    const state = learnReducer(answer(massStep), { type: "startExploring" });
    expect(state.phase).toBe("explore");
    expect(state.scene).toEqual(INITIAL_SCENE);
  });

  it("no se puede explorar antes de ver el resultado", () => {
    const state = learnReducer(INITIAL_LEARN_STATE, { type: "startExploring" });
    expect(state).toBe(INITIAL_LEARN_STATE);
  });

  it("volver a un paso ya respondido no repite la predicción", () => {
    const state = previous(next(answer(INITIAL_LEARN_STATE)));
    expect(state.phase).toBe("explore");
  });

  it("el paso siguiente sin responder empieza prediciendo", () => {
    expect(next(answer(INITIAL_LEARN_STATE)).phase).toBe("predict");
  });

  it("el cierre solo llega tras responder el último paso", () => {
    expect(
      learnReducer(answer(INITIAL_LEARN_STATE), { type: "finish" }).phase,
    ).toBe("result");
    const last = answer(
      next(answer(next(answer(next(answer(INITIAL_LEARN_STATE)))))),
    );
    const closing = learnReducer(last, { type: "finish" });
    expect(closing.phase).toBe("closing");
    expect(learnReducer(closing, { type: "review" }).phase).toBe("explore");
  });

  it("no pasa del último paso", () => {
    const last = answer(
      next(answer(next(answer(next(answer(INITIAL_LEARN_STATE)))))),
    );
    expect(last.stepIndex).toBe(STEPS.length - 1);
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
