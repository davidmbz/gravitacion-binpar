import type { ReactNode } from "react";
import type { LearnState } from "./learn-reducer";
import type { StepId } from "./steps";

function Piece({ isNew, children }: { isNew: boolean; children: ReactNode }) {
  return (
    <span className={isNew ? "text-cinnabar" : undefined}>{children}</span>
  );
}

/** La ley en palabras. En columna va en el panel: en la mesa no cabe. */
export const LAW_SUMMARY =
  "La fuerza crece con las masas y cae con el cuadrado de la distancia. G es una constante universal.";

const masses = (
  <>
    <i>m</i>
    <sub>1</sub> · <i>m</i>
    <sub>2</sub>
  </>
);

type FormulaProps = {
  predictions: LearnState["predictions"];
  currentStepId: StepId;
  /** En el cierre, la fórmula es la protagonista de la mesa. */
  size: "chip" | "hero";
};

// Cada pieza aparece al responder su paso, nunca antes: si no, la fórmula
// delataría la respuesta. El signo ? marca lo que aún falta por descubrir.
export function Formula({ predictions, currentStepId, size }: FormulaProps) {
  const hasForce = predictions.attraction.status === "answered";
  const hasMasses = predictions.mass.status === "answered";
  const hasDistance = predictions.distance.status === "answered";

  if (!hasForce) return null;

  const spokenFormula = hasDistance
    ? "F igual a G por m 1 por m 2, dividido entre r al cuadrado"
    : hasMasses
      ? "F igual a algo por descubrir, por m 1 por m 2"
      : "F igual a algo por descubrir";

  return (
    <div className={size === "hero" ? "text-center" : undefined}>
      <p className="sr-only">La ley, hasta ahora: {spokenFormula}</p>
      <div
        aria-hidden="true"
        className={`flex items-center ${
          size === "hero"
            ? // En columna, la mesa es una franja: la fórmula se mide por la pantalla.
              "justify-center gap-4 text-[clamp(1.875rem,min(9vw,7dvh),3rem)] leading-tight whitespace-nowrap lg:text-7xl"
            : "gap-2 text-xl leading-none lg:text-2xl"
        }`}
      >
        <Piece isNew={size === "chip" && currentStepId === "attraction"}>
          <i>F</i>
        </Piece>
        <span>=</span>
        {hasDistance ? (
          <span
            className={`inline-flex flex-col items-center ${
              size === "hero" ? "gap-3" : "gap-1"
            }`}
          >
            <span className="border-b border-ink px-2 pb-1">
              <Piece isNew={size === "chip" && currentStepId === "distance"}>
                <i>G</i>
              </Piece>{" "}
              · {masses}
            </span>
            <Piece isNew={size === "chip" && currentStepId === "distance"}>
              <i>r</i>
              {/* Sin esto, el superíndice sube la línea y toca la fracción. */}
              <sup className="top-[-0.3em] text-[0.6em]">2</sup>
            </Piece>
          </span>
        ) : (
          <span>
            ?
            {hasMasses && (
              <>
                {" "}
                · <Piece isNew={currentStepId === "mass"}>{masses}</Piece>
              </>
            )}
          </span>
        )}
      </div>
      {size === "hero" && (
        <p className="mt-6 hidden text-lg text-ink-soft lg:block">
          {LAW_SUMMARY}
        </p>
      )}
    </div>
  );
}
