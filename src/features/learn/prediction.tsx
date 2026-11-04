"use client";

import { useRef, useState, type FormEvent, type Ref } from "react";
import { flushSync } from "react-dom";
import type { PredictionState } from "./learn-reducer";
import { SprayFigure } from "./spray-figure";
import { gradePrediction, type Step } from "./steps";

type FeedbackProps = {
  step: Step;
  optionId: string;
  ref: Ref<HTMLDivElement>;
};

function Feedback({ step, optionId, ref }: FeedbackProps) {
  const { isCorrect, explanation } = gradePrediction(step, optionId);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`mt-5 scroll-mt-60 border-l-2 pl-4 lg:scroll-mt-6 ${
        isCorrect ? "border-verdigris" : "border-cinnabar"
      }`}
    >
      <p
        className={`text-lg ${isCorrect ? "text-verdigris" : "text-cinnabar"}`}
      >
        {isCorrect ? "Has acertado" : "No es esa"}
      </p>
      <p className="mt-1">{explanation}</p>
      <p className="mt-3">{step.takeaway}</p>
      {step.id === "distance" && <SprayFigure />}
      <p className="mt-3 italic">{step.invitation}</p>
      <p className="mt-3">
        <a href="#tutor-title" className="inline-block py-2">
          ¿Algo no te encaja? Pregunta al tutor
        </a>
      </p>
    </div>
  );
}

function optionNote(step: Step, optionId: string, chosenId: string) {
  if (optionId === step.correctOptionId) {
    return optionId === chosenId
      ? "Tu respuesta, correcta"
      : "Respuesta correcta";
  }
  return optionId === chosenId ? "Tu respuesta" : null;
}

type PredictionProps = {
  step: Step;
  prediction: PredictionState;
  onAnswer: (optionId: string) => void;
};

export function Prediction({ step, prediction, onAnswer }: PredictionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const isAnswered = prediction.status === "answered";
  const checkedId = isAnswered ? prediction.optionId : selectedId;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedId === null) return;
    // flushSync: el foco solo puede ir a la corrección cuando ya está en el DOM.
    flushSync(() => onAnswer(selectedId));
    feedbackRef.current?.focus();
  }

  return (
    <div className="mt-5">
      <form onSubmit={handleSubmit}>
        <fieldset disabled={isAnswered}>
          <legend className="text-lg">{step.question}</legend>
          <div className="mt-3 space-y-1">
            {step.options.map((option) => {
              const note = isAnswered
                ? optionNote(step, option.id, prediction.optionId)
                : null;
              return (
                <label
                  key={option.id}
                  className={`flex min-h-11 items-start gap-3 py-2 ${
                    isAnswered ? "" : "cursor-pointer hover:bg-paper-deep"
                  }`}
                >
                  <input
                    type="radio"
                    name={`prediction-${step.id}`}
                    value={option.id}
                    checked={checkedId === option.id}
                    onChange={() => setSelectedId(option.id)}
                    className="mt-1.5 size-4 shrink-0 accent-prussian"
                  />
                  <span>
                    {option.label}
                    {note && (
                      <span className="block text-ink-soft italic">{note}</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {!isAnswered && (
          <button
            type="submit"
            disabled={selectedId === null}
            className="mt-3 min-h-11 cursor-pointer bg-prussian px-5 text-paper disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-soft"
          >
            Comprobar mi predicción
          </button>
        )}
      </form>
      {isAnswered && (
        <Feedback
          ref={feedbackRef}
          step={step}
          optionId={prediction.optionId}
        />
      )}
    </div>
  );
}
