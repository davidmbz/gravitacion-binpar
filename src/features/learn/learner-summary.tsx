import type { LearnerProfile } from "./learner-profile";

const STATUS_LABELS = {
  demonstrated: "Demostrado",
  "to-review": "Por reforzar",
};

export function LearnerSummary({ profile }: { profile: LearnerProfile }) {
  const { concepts, misconceptions } = profile;

  if (concepts.length === 0) return null;

  return (
    <section
      aria-labelledby="profile-title"
      className="border-t border-rule pt-4"
    >
      <h3 id="profile-title" className="text-xl">
        Lo que has demostrado
      </h3>
      <ul className="mt-3 space-y-2">
        {concepts.map(({ stepId, concept, status }) => (
          <li key={stepId}>
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
          <p className="mt-3">Para repasar con el tutor:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">
            {misconceptions.map((misconception) => (
              <li key={misconception}>{misconception}</li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-ink-soft">
        Se basa en una pregunta por concepto, así que es una pista, no una nota.
      </p>
    </section>
  );
}
