"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { tabId, TabList, tabPanelId } from "@/components/tabs";
import { useViewportHeight } from "@/components/use-viewport-height";
import { simulateLaunch } from "@/lib/physics/moon-launch";
import { primaryAction, secondaryAction } from "./controls";
import { Formula } from "./formula";
import { LaunchCanvas, type FlightState } from "./launch-canvas";
import { LaunchControls } from "./launch-controls";
import { describeOutcome } from "./launch-text";
import { LearnProgress, progressLabel } from "./learn-progress";
import {
  answersOf,
  areForcesVisible,
  currentPrediction,
  EXAMPLE_LAUNCH,
  INITIAL_LEARN_STATE,
  learnReducer,
  type LearnAction,
} from "./learn-reducer";
import { deriveProfile, suggestionsFor } from "./learner-profile";
import { LearnerSummary } from "./learner-summary";
import { Prediction, PREDICTION_FORM_ID } from "./prediction";
import { ResultPanel } from "./result-panel";
import {
  describeScene,
  formatMultiple,
  INITIAL_SCENE,
  relativeForce,
  sameScene,
} from "./scene";
import { SceneControls } from "./scene-controls";
import { STEPS } from "./steps";
import { TableCanvas } from "./table-canvas";
import { TutorPanel } from "./tutor-panel";

// Tiempo sin cambios antes de anunciar: arrastrar un control no debe leer cada valor.
const ANNOUNCE_DELAY_MS = 800;

/** Lo bastante lenta para seguir qué cambia, sin hacer esperar. */
const RESULT_TRANSITION_MS = 800;
const EXPLORE_TRANSITION_MS = 180;

const PANEL_TABS = [
  { id: "step", label: "Paso" },
  { id: "tutor", label: "Tutor" },
] as const;

type PanelTab = (typeof PANEL_TABS)[number]["id"];

const TABS_ID = "learn";

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

export function LearnExperience() {
  useViewportHeight();

  const [state, dispatch] = useReducer(learnReducer, INITIAL_LEARN_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flight, setFlight] = useState<FlightState>({ status: "ready" });
  const [panelTab, setPanelTab] = useState<PanelTab>("step");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = STEPS[state.stepIndex];
  const { phase } = state;
  const prediction = currentPrediction(state);
  const forcesVisible = areForcesVisible(state);
  const isLastStep = state.stepIndex === STEPS.length - 1;
  const isLaunchStep = step.id === "orbit";
  const answers = answersOf(state);
  const multiple = formatMultiple(relativeForce(state.scene));
  const reference = sameScene(state.scene, INITIAL_SCENE)
    ? null
    : INITIAL_SCENE;

  const handleLanded = useCallback(() => {
    setFlight((current) =>
      current.status === "flying"
        ? { status: "landed", flight: current.flight }
        : current,
    );
  }, []);

  /** Cada cambio de fase lleva el foco al título de la fase nueva. */
  function go(
    action: LearnAction,
    nextFlight: FlightState = { status: "ready" },
  ) {
    flushSync(() => {
      dispatch(action);
      setFlight(nextFlight);
      setPanelTab("step");
      setSelectedId(null);
    });
    headingRef.current?.focus();
  }

  function submitPrediction() {
    if (selectedId === null) return;
    go(
      { type: "answerPrediction", optionId: selectedId },
      isLaunchStep
        ? { status: "flying", flight: simulateLaunch(EXAMPLE_LAUNCH) }
        : { status: "ready" },
    );
  }

  const stageNote =
    flight.status === "landed"
      ? describeOutcome(flight.flight.outcome)
      : flight.status === "flying"
        ? "En vuelo."
        : phase === "explore"
          ? "Elige velocidad y ángulo, y lanza."
          : "Responde para poder lanzar.";

  const title =
    phase === "closing"
      ? "Lo que has demostrado"
      : phase === "explore"
        ? "Compruébalo tú"
        : step.title;

  return (
    <div className="app-screen flex flex-col lg:flex-row">
      <section
        aria-label="Simulación"
        className="app-stage stage-grid relative min-h-0 flex-[0_0_40%] lg:flex-1 [@media(max-height:44rem)]:basis-[34%] lg:[@media(max-height:44rem)]:basis-0"
      >
        {phase === "closing" ? (
          <div className="flex h-full items-center justify-center p-6">
            {/* La animación va dentro: en un bloque de alto completo, su
                desplazamiento haría aparecer el scroll de la página. */}
            <div className="phase-in max-w-xl">
              <Formula
                predictions={state.predictions}
                currentStepId={step.id}
                size="hero"
              />
            </div>
          </div>
        ) : isLaunchStep ? (
          <>
            <LaunchCanvas
              launch={state.launch}
              flight={flight}
              onLanded={handleLanded}
            />
            <p
              role="status"
              aria-label="Resultado del lanzamiento"
              className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] rounded-md bg-stage/90 px-2 py-1 leading-snug lg:top-5 lg:left-6 lg:max-w-md lg:text-lg"
            >
              {stageNote}
            </p>
          </>
        ) : (
          <>
            <TableCanvas
              scene={state.scene}
              forcesVisible={forcesVisible}
              reference={reference}
              transitionMs={
                phase === "result"
                  ? RESULT_TRANSITION_MS
                  : EXPLORE_TRANSITION_MS
              }
              description={describeScene(state.scene, forcesVisible)}
            />
            <div className="pointer-events-none absolute top-3 left-3 lg:top-5 lg:left-6">
              <Formula
                predictions={state.predictions}
                currentStepId={step.id}
                size="chip"
              />
            </div>
            {forcesVisible && (
              <div
                key={`${step.id}-${phase}`}
                className="pop-in pointer-events-none absolute top-3 right-3 text-right lg:top-5 lg:right-6"
              >
                <p className="text-4xl leading-none text-cinnabar lg:text-6xl">
                  {multiple}
                </p>
                <p className="mt-1 text-ink-soft">
                  {phase === "result" && step.resultNote
                    ? step.resultNote
                    : "respecto a la escena inicial"}
                </p>
              </div>
            )}
            <LiveSummary
              text={
                forcesVisible
                  ? `Fuerza ${multiple} respecto a la escena inicial.`
                  : ""
              }
            />
          </>
        )}
      </section>

      <aside
        aria-label="Recorrido"
        className="flex min-h-0 flex-1 flex-col border-t border-rule bg-paper lg:w-[23rem] lg:flex-none lg:border-t-0 lg:border-l"
      >
        <div className="px-4 pt-3">
          <h1 className="sr-only lg:not-sr-only lg:mb-2 lg:text-xl">
            Aprende la ley
          </h1>
          <LearnProgress stepIndex={state.stepIndex} phase={phase} />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-rule pr-4 pl-1">
          <TabList
            label="Contenido del panel"
            tabs={PANEL_TABS}
            active={panelTab}
            idPrefix={TABS_ID}
            onChange={setPanelTab}
          />
          <p className="text-ink-soft italic">
            {progressLabel(state.stepIndex, phase)}
          </p>
        </div>

        <div
          id={tabPanelId(TABS_ID, "step")}
          role="tabpanel"
          aria-labelledby={tabId(TABS_ID, "step")}
          hidden={panelTab !== "step"}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
        >
          <div key={`${step.id}-${phase}`} className="phase-in">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl leading-tight"
            >
              {title}
            </h2>

            {phase === "predict" && (
              <>
                <p className="mt-2">{step.intro}</p>
                <Prediction
                  step={step}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onSubmit={submitPrediction}
                />
              </>
            )}

            {phase === "result" && prediction.status === "answered" && (
              <ResultPanel step={step} optionId={prediction.optionId} />
            )}

            {phase === "explore" && (
              <>
                <p className="mt-2">{step.invitation}</p>
                {isLaunchStep ? (
                  <LaunchControls
                    launch={state.launch}
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
                    onChange={(scene) => dispatch({ type: "setScene", scene })}
                  />
                )}
              </>
            )}

            {phase === "closing" && (
              <LearnerSummary profile={deriveProfile(answers)} />
            )}
          </div>
        </div>

        <div
          id={tabPanelId(TABS_ID, "tutor")}
          role="tabpanel"
          aria-labelledby={tabId(TABS_ID, "tutor")}
          hidden={panelTab !== "tutor"}
          className="min-h-0 flex-1"
        >
          <TutorPanel
            stepId={step.id}
            suggestions={suggestionsFor(step, answers[step.id])}
            answers={answers}
            scene={state.scene}
            launch={state.launch}
            onSceneChange={(scene) => dispatch({ type: "setScene", scene })}
          />
        </div>

        <nav
          aria-label="Acciones del paso"
          className="app-actions safe-bottom flex gap-2 border-t border-rule px-4 pt-3"
        >
          {phase === "closing" ? (
            <>
              <button
                type="button"
                onClick={() => go({ type: "review" })}
                className={secondaryAction}
              >
                Repasar
              </button>
              <Link href="/orbitas" className={primaryAction}>
                Ver las seis órbitas
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={state.stepIndex === 0}
                onClick={() => go({ type: "previousStep" })}
                className={secondaryAction}
              >
                Atrás
              </button>
              {phase === "predict" && (
                <button
                  type="submit"
                  form={PREDICTION_FORM_ID}
                  disabled={selectedId === null}
                  className={primaryAction}
                >
                  Comprobar mi predicción
                </button>
              )}
              {phase === "result" && (
                <button
                  type="button"
                  onClick={() => go({ type: "startExploring" })}
                  className={primaryAction}
                >
                  Probarlo yo
                </button>
              )}
              {phase === "explore" && (
                <button
                  type="button"
                  onClick={() =>
                    go({ type: isLastStep ? "finish" : "nextStep" })
                  }
                  className={primaryAction}
                >
                  {isLastStep ? "Ver lo que has demostrado" : "Paso siguiente"}
                </button>
              )}
            </>
          )}
        </nav>
      </aside>
    </div>
  );
}
