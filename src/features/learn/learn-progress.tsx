import type { LearnPhase } from "./learn-reducer";
import { STEPS } from "./steps";

const PHASE_LABELS: Record<LearnPhase, string> = {
  predict: "Predice",
  result: "Resultado",
  explore: "Explora",
  closing: "Cierre",
};

type LearnProgressProps = {
  stepIndex: number;
  phase: LearnPhase;
};

export function LearnProgress({ stepIndex, phase }: LearnProgressProps) {
  const isClosing = phase === "closing";

  return (
    <ol aria-label="Pasos del recorrido" className="flex gap-1">
      {STEPS.map(({ id, title }, index) => {
        const isDone = isClosing || index < stepIndex;
        const isCurrent = !isClosing && index === stepIndex;
        return (
          <li
            key={id}
            aria-current={isCurrent ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              isCurrent
                ? "bg-cinnabar"
                : isDone
                  ? "bg-prussian"
                  : "bg-paper-deep"
            }`}
          >
            <span className="sr-only">{title}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Texto de progreso: comparte fila con las pestañas para ahorrar alto en móvil. */
export function progressLabel(stepIndex: number, phase: LearnPhase): string {
  return phase === "closing"
    ? "Recorrido completo"
    : `${stepIndex + 1} de ${STEPS.length}: ${PHASE_LABELS[phase]}`;
}
