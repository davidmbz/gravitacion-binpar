import type { LearnerProfile } from "./learner-profile";

const STATUS_LABELS = {
  demonstrated: "Demostrado",
  "to-review": "Por reforzar",
};

export function LearnerSummary({ profile }: { profile: LearnerProfile }) {
  const { concepts, misconceptions } = profile;
  const demonstrated = concepts.filter(
    ({ status }) => status === "demonstrated",
  ).length;

  return (
    <>
      <p className="mt-2 text-lg">
        Has acertado {demonstrated} de {concepts.length} predicciones.
      </p>
      <ul className="mt-3 space-y-2">
        {concepts.map(({ stepId, concept, status }) => (
          <li
            key={stepId}
            className={`border-l-2 pl-3 leading-snug ${
              status === "demonstrated" ? "border-verdigris" : "border-cinnabar"
            }`}
          >
            {concept}
            <span
              className={`block italic ${
                status === "demonstrated" ? "text-verdigris" : "text-cinnabar"
              }`}
            >
              {STATUS_LABELS[status]}
            </span>
          </li>
        ))}
      </ul>
      {misconceptions.length > 0 && (
        <>
          <p className="mt-4">Para repasar con el tutor:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">
            {misconceptions.map((misconception) => (
              <li key={misconception}>{misconception}</li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-4 text-ink-soft">
        Se basa en una pregunta por concepto, así que es una pista, no una nota.
      </p>
    </>
  );
}
