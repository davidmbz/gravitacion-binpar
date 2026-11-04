import type { FormEvent } from "react";
import type { Step } from "./steps";

export const PREDICTION_FORM_ID = "prediction-form";

type PredictionProps = {
  step: Step;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  onSubmit: () => void;
};

export function Prediction({
  step,
  selectedId,
  onSelect,
  onSubmit,
}: PredictionProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedId !== null) onSubmit();
  }

  return (
    // El botón de enviar vive en la barra de acciones, enlazado por `form`.
    <form id={PREDICTION_FORM_ID} onSubmit={handleSubmit} className="mt-3">
      <fieldset>
        <legend className="text-lg leading-snug">{step.question}</legend>
        <div className="mt-3 space-y-2">
          {step.options.map((option) => (
            <label
              key={option.id}
              className="flex min-h-12 cursor-pointer items-start gap-3 rounded-md border border-rule p-3 leading-snug transition-colors duration-150 hover:border-ink has-checked:border-prussian has-checked:bg-paper-deep"
            >
              <input
                type="radio"
                name={`prediction-${step.id}`}
                value={option.id}
                checked={selectedId === option.id}
                onChange={() => onSelect(option.id)}
                className="mt-1 size-4 shrink-0 accent-prussian"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
