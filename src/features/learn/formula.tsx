import type { ReactNode } from "react";
import type { LearnState } from "./learn-reducer";
import type { StepId } from "./steps";

function Piece({ isNew, children }: { isNew: boolean; children: ReactNode }) {
  return (
    <span className={isNew ? "text-cinnabar" : undefined}>{children}</span>
  );
}

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
};

// Cada pieza aparece al responder su paso, nunca antes: si no, la fórmula
// delataría la respuesta. El signo ? marca lo que aún falta por descubrir.
export function Formula({ predictions, currentStepId }: FormulaProps) {
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
    <section
      aria-labelledby="formula-title"
      className="border-t border-rule pt-4"
    >
      <h3 id="formula-title" className="text-xl">
        La ley, hasta ahora
      </h3>
      <p className="sr-only">{spokenFormula}</p>
      <div
        aria-hidden="true"
        className="mt-3 flex items-center gap-3 text-3xl leading-none"
      >
        <Piece isNew={currentStepId === "attraction"}>
          <i>F</i>
        </Piece>
        <span>=</span>
        {hasDistance ? (
          <span className="inline-flex flex-col items-center gap-1">
            <span className="border-b border-ink px-2 pb-2">
              <Piece isNew={currentStepId === "distance"}>
                <i>G</i>
              </Piece>{" "}
              · {masses}
            </span>
            <Piece isNew={currentStepId === "distance"}>
              <i>r</i>
              <sup>2</sup>
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
      <dl className="mt-4 space-y-1">
        <div>
          <dt className="inline italic">F</dt>
          <dd className="inline">: la fuerza, igual en los dos cuerpos.</dd>
        </div>
        {hasMasses && (
          <div>
            <dt className="inline italic">
              m<sub>1</sub> y m<sub>2</sub>
            </dt>
            <dd className="inline">: las masas de los dos cuerpos.</dd>
          </div>
        )}
        {hasDistance && (
          <>
            <div>
              <dt className="inline italic">r</dt>
              <dd className="inline">: la distancia entre ellos.</dd>
            </div>
            <div>
              <dt className="inline italic">G</dt>
              <dd className="inline">: una constante universal.</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
