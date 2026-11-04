"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { simulateLaunch } from "@/lib/physics/moon-launch";
import { Formula } from "./formula";
import { LaunchCanvas, type FlightState } from "./launch-canvas";
import { LaunchControls } from "./launch-controls";
import { describeOutcome } from "./launch-text";
import {
  answersOf,
  areForcesVisible,
  currentPrediction,
  INITIAL_LEARN_STATE,
  learnReducer,
  type LearnAction,
} from "./learn-reducer";
import { deriveProfile, suggestionsFor } from "./learner-profile";
import { LearnerSummary } from "./learner-summary";
import { Prediction } from "./prediction";
import {
  describeScene,
  formatMultiple,
  INITIAL_SCENE,
  relativeForce,
} from "./scene";
import { SceneControls } from "./scene-controls";
import { STEPS } from "./steps";
import { TableCanvas } from "./table-canvas";
import { TutorPanel } from "./tutor-panel";

// Tiempo sin cambios antes de anunciar: arrastrar un control no debe leer cada valor.
const ANNOUNCE_DELAY_MS = 800;

function LiveSummary({ text }: { text: string }) {
  const [announced, setAnnounced] = useState(text);

  useEffect(() => {
    const timeout = setTimeout(() => setAnnounced(text), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <p aria-live="polite" className="sr-only">
      {announced}
    </p>
  );
}

const secondaryButton =
  "min-h-11 cursor-pointer border border-ink px-4 hover:bg-paper-deep disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-soft disabled:hover:bg-transparent";

export function LearnExperience() {
  const [state, dispatch] = useReducer(learnReducer, INITIAL_LEARN_STATE);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = STEPS[state.stepIndex];
  const prediction = currentPrediction(state);
  const isPending = prediction.status === "pending";
  const forcesVisible = areForcesVisible(state);
  const isLastStep = state.stepIndex === STEPS.length - 1;
  const multiple = formatMultiple(relativeForce(state.scene));
  const answers = answersOf(state);
  const isLaunchStep = step.id === "orbit";
  const [flight, setFlight] = useState<FlightState>({ status: "ready" });

  const handleLanded = useCallback(() => {
    setFlight((current) =>
      current.status === "flying"
        ? { status: "landed", flight: current.flight }
        : current,
    );
  }, []);

  function moveToStep(action: LearnAction) {
    // flushSync: el foco debe llegar al título cuando ya muestra el paso nuevo.
    flushSync(() => {
      dispatch(action);
      setFlight({ status: "ready" });
    });
    headingRef.current?.focus();
  }

  return (
    <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-start lg:gap-12">
      {/* Sticky solo con altura suficiente: en un móvil apaisado taparía la pantalla. */}
      <figure className="top-0 z-10 -mx-4 border-b border-rule bg-paper px-4 py-2 sm:-mx-8 sm:px-8 lg:sticky lg:top-6 lg:mx-0 lg:border-b-0 lg:p-0 [@media(min-height:32rem)]:sticky">
        <div className="border border-rule">
          {isLaunchStep ? (
            <LaunchCanvas
              launch={state.launch}
              flight={flight}
              onLanded={handleLanded}
            />
          ) : (
            <TableCanvas
              scene={state.scene}
              forcesVisible={forcesVisible}
              description={describeScene(state.scene, forcesVisible)}
            />
          )}
        </div>
        {isLaunchStep ? (
          <figcaption className="mt-2 leading-snug">
            {flight.status === "landed"
              ? describeOutcome(flight.flight.outcome)
              : flight.status === "flying"
                ? "En vuelo."
                : isPending
                  ? "Responde para poder lanzar."
                  : "Elige velocidad y ángulo, y lanza."}
            <span className="hidden text-sm text-ink-soft italic lg:mt-1 lg:block">
              Fig. 3. La luna parte de lo alto, y se calcula un tramo limitado.
            </span>
          </figcaption>
        ) : (
          <figcaption className="mt-2 leading-snug">
            {forcesVisible ? (
              <>
                Fuerza:{" "}
                <span className="text-xl text-cinnabar">{multiple}</span>{" "}
                respecto a la escena inicial.
              </>
            ) : (
              "Las flechas de fuerza aparecen al responder."
            )}
            <span className="hidden text-sm text-ink-soft italic lg:mt-1 lg:block">
              Fig. 1. Al inicio: masas {INITIAL_SCENE.massA} y{" "}
              {INITIAL_SCENE.massB}, distancia {INITIAL_SCENE.distance}.
            </span>
          </figcaption>
        )}
        <LiveSummary
          text={
            isLaunchStep
              ? flight.status === "landed"
                ? describeOutcome(flight.flight.outcome)
                : ""
              : forcesVisible
                ? `Fuerza ${multiple} respecto a la escena inicial.`
                : ""
          }
        />
      </figure>

      <div className="mt-6 space-y-6 lg:mt-0">
        <section aria-labelledby="step-title">
          <ol className="flex flex-wrap gap-x-5 gap-y-1">
            {STEPS.map(({ id, title }, index) => {
              const isCurrent = index === state.stepIndex;
              return (
                <li
                  key={id}
                  aria-current={isCurrent ? "step" : undefined}
                  className={
                    isCurrent
                      ? "underline decoration-cinnabar decoration-2 underline-offset-4"
                      : "text-ink-soft"
                  }
                >
                  {index + 1}. {title}
                </li>
              );
            })}
          </ol>
          <h2
            id="step-title"
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 scroll-mt-60 text-2xl sm:text-3xl lg:scroll-mt-6"
          >
            {step.title}
          </h2>
          <p className="mt-2">{step.intro}</p>
          <Prediction
            key={step.id}
            step={step}
            prediction={prediction}
            onAnswer={(optionId) =>
              dispatch({ type: "answerPrediction", optionId })
            }
          />
        </section>

        {isLaunchStep ? (
          <LaunchControls
            launch={state.launch}
            disabled={isPending}
            isFlying={flight.status === "flying"}
            onChange={(launch) => {
              dispatch({ type: "setLaunch", launch });
              setFlight({ status: "ready" });
            }}
            onLaunch={() =>
              setFlight({
                status: "flying",
                flight: simulateLaunch(state.launch),
              })
            }
          />
        ) : (
          <SceneControls
            scene={state.scene}
            disabled={isPending}
            onChange={(scene) => dispatch({ type: "setScene", scene })}
          />
        )}

        <Formula predictions={state.predictions} currentStepId={step.id} />

        <LearnerSummary profile={deriveProfile(answers)} />

        <TutorPanel
          stepId={step.id}
          suggestions={suggestionsFor(step, answers[step.id])}
          answers={answers}
          scene={state.scene}
          launch={state.launch}
          onSceneChange={(scene) => dispatch({ type: "setScene", scene })}
        />

        <nav
          aria-label="Pasos"
          className="flex flex-wrap items-center gap-3 border-t border-rule pt-4"
        >
          <button
            type="button"
            disabled={state.stepIndex === 0}
            onClick={() => moveToStep({ type: "previousStep" })}
            className={secondaryButton}
          >
            Paso anterior
          </button>
          {isLastStep ? (
            !isPending && <Link href="/orbitas">Ver las seis órbitas</Link>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => moveToStep({ type: "nextStep" })}
              className={secondaryButton}
            >
              Paso siguiente
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
