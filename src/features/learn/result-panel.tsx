import { secondaryAction } from "./controls";
import { SprayFigure } from "./spray-figure";
import { gradePrediction, type Step } from "./steps";

type ResultPanelProps = {
  step: Step;
  optionId: string;
  onAskTutor: () => void;
};

export function ResultPanel({ step, optionId, onAskTutor }: ResultPanelProps) {
  const { isCorrect, explanation } = gradePrediction(step, optionId);

  return (
    <div className="mt-3">
      <p
        className={`text-2xl ${isCorrect ? "text-verdigris" : "text-cinnabar"}`}
      >
        {isCorrect ? "Has acertado" : "No es esa"}
      </p>
      <p className="mt-2">{explanation}</p>
      <p className="mt-3">{step.takeaway}</p>
      {!isCorrect && (
        <button
          type="button"
          onClick={onAskTutor}
          className={`${secondaryAction} mt-3 w-full border-prussian text-prussian`}
        >
          Preguntar al tutor por qué
        </button>
      )}
      {step.id === "distance" && (
        <details className="mt-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-prussian">
            Ver el dibujo del espray
          </summary>
          <SprayFigure />
        </details>
      )}
    </div>
  );
}
