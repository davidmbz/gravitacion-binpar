import { SprayFigure } from "./spray-figure";
import { gradePrediction, type Step } from "./steps";

type ResultPanelProps = {
  step: Step;
  optionId: string;
};

export function ResultPanel({ step, optionId }: ResultPanelProps) {
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
