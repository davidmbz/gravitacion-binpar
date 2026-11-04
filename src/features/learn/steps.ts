export type StepId = "attraction" | "mass" | "distance";

export type MisconceptionId =
  | "larger-mass-pulls-harder"
  | "larger-mass-receives-more"
  | "force-ignores-a-mass"
  | "doubled-both-masses"
  | "force-on-one-body"
  | "force-falls-linearly"
  | "force-ignores-distance"
  | "gravity-vanishes-far-away";

/** Error de razonamiento que revela cada opción incorrecta. */
export const MISCONCEPTIONS: Record<MisconceptionId, string> = {
  "larger-mass-pulls-harder": "Creer que el cuerpo de más masa tira más fuerte",
  "larger-mass-receives-more":
    "Creer que el cuerpo de más masa recibe más fuerza",
  "force-ignores-a-mass": "Creer que la fuerza depende de una sola masa",
  "doubled-both-masses": "Confundir duplicar una masa con duplicar las dos",
  "force-on-one-body": "Creer que la fuerza cambia solo en un cuerpo",
  "force-falls-linearly":
    "Creer que la fuerza baja en proporción directa a la distancia",
  "force-ignores-distance": "Creer que la distancia no afecta a la fuerza",
  "gravity-vanishes-far-away":
    "Creer que la gravedad desaparece a gran distancia",
};

export type PredictionOption = {
  id: string;
  label: string;
  explanation: string;
  /** Solo en las opciones incorrectas. */
  misconception?: MisconceptionId;
};

export type Step = {
  id: StepId;
  title: string;
  /** Lo que queda demostrado al acertar. Solo se muestra tras responder. */
  concept: string;
  intro: string;
  question: string;
  options: readonly PredictionOption[];
  correctOptionId: string;
  /** Se muestra siempre tras responder, se haya acertado o no. */
  takeaway: string;
  invitation: string;
  /** Preguntas para el tutor. Las de antes de responder no delatan el resultado. */
  tutorPrompts: { pending: readonly string[]; answered: readonly string[] };
};

export const STEPS: readonly Step[] = [
  {
    id: "attraction",
    title: "Atracción mutua",
    concept: "Las dos fuerzas son iguales y opuestas",
    intro:
      "Dos cuerpos cualesquiera se atraen. En la mesa, A tiene el doble de masa que B.",
    question: "¿Cómo crees que son las fuerzas que actúan sobre cada cuerpo?",
    options: [
      {
        id: "stronger-on-b",
        misconception: "larger-mass-pulls-harder",
        label: "A atrae a B con más fuerza que B a A, porque tiene más masa",
        explanation:
          "Es la intuición más habitual: más masa, más fuerza. La masa de A sí aumenta la atracción, pero la aumenta para los dos cuerpos por igual.",
      },
      {
        id: "stronger-on-a",
        misconception: "larger-mass-receives-more",
        label: "La fuerza sobre A es mayor, porque hay más masa que atraer",
        explanation:
          "A tiene más masa, pero eso no hace que reciba más fuerza que B. La atracción es cosa de la pareja y llega con la misma intensidad a los dos.",
      },
      {
        id: "equal-and-opposite",
        label: "Son iguales y van en sentidos opuestos",
        explanation:
          "Así es. Aunque A tenga el doble de masa, las dos fuerzas miden lo mismo y cada una apunta hacia el otro cuerpo.",
      },
    ],
    correctOptionId: "equal-and-opposite",
    takeaway:
      "Es una sola atracción con dos extremos. Lo que cambia es el efecto: con la misma fuerza, el cuerpo de menos masa se mueve más. Por eso vemos caer la manzana y no vemos subir la Tierra.",
    invitation:
      "Compruébalo: cambia las masas y la distancia. Las dos flechas crecen y menguan a la vez, y siempre miden lo mismo.",
    tutorPrompts: {
      pending: [
        "¿Qué significa aquí la palabra fuerza?",
        "Dame una pista sin decirme la respuesta",
      ],
      answered: [
        "Si las fuerzas son iguales, ¿por qué cae la manzana y no sube la Tierra?",
        "Enséñame en la mesa dos masas muy distintas",
      ],
    },
  },
  {
    id: "mass",
    title: "Masa",
    concept: "La fuerza es proporcional a cada masa",
    intro:
      "La mesa vuelve a la escena inicial: A con masa 4 y B con masa 2. Esa fuerza de partida es nuestra referencia, ×1.",
    question:
      "Si duplicas la masa de A y dejas B como está, ¿qué le pasa a la fuerza?",
    options: [
      {
        id: "unchanged",
        misconception: "force-ignores-a-mass",
        label: "No cambia, porque B sigue igual",
        explanation:
          "B sigue igual, pero la fuerza depende de las dos masas a la vez. Si cambia cualquiera de ellas, cambia la fuerza.",
      },
      {
        id: "doubles",
        label: "Se duplica: ×2",
        explanation:
          "Así es. Si una de las masas se duplica, la fuerza también.",
      },
      {
        id: "quadruples",
        misconception: "doubled-both-masses",
        label: "Se multiplica por cuatro: ×4",
        explanation:
          "Eso ocurre si duplicas las dos masas: ×2 por A y otro ×2 por B. Aquí solo cambia una, así que la fuerza se multiplica una sola vez.",
      },
      {
        id: "only-on-b",
        misconception: "force-on-one-body",
        label: "Solo crece la fuerza sobre B",
        explanation:
          "Las dos flechas siguen midiendo lo mismo, como en el paso anterior. Si la atracción crece, crece para los dos cuerpos.",
      },
    ],
    correctOptionId: "doubles",
    takeaway:
      "La fuerza es proporcional a cada masa: si una se multiplica por tres, la fuerza se multiplica por tres. Por eso, en la fórmula, las dos masas aparecen multiplicadas entre sí.",
    invitation:
      "Compruébalo: sube A de 4 a 8 y mira el número. Después sube B de 2 a 4: la fuerza vuelve a duplicarse y llega a ×4.",
    tutorPrompts: {
      pending: [
        "¿Qué es la masa? ¿Es lo mismo que el peso?",
        "Dame una pista sin decirme la respuesta",
      ],
      answered: [
        "¿Por qué las masas se multiplican y no se suman?",
        "Enséñame en la mesa qué pasa si duplico las dos masas",
      ],
    },
  },
  {
    id: "distance",
    title: "Distancia",
    concept: "A doble distancia, un cuarto de la fuerza",
    intro:
      "La mesa vuelve a la escena inicial, con los cuerpos a distancia 4. Ahora toca separarlos.",
    question:
      "Si los separas hasta el doble de distancia, ¿qué le pasa a la fuerza?",
    options: [
      {
        id: "half",
        misconception: "force-falls-linearly",
        label: "Se queda en la mitad: ×½",
        explanation:
          "Es la respuesta más natural: doble de distancia, mitad de fuerza. Pero la fuerza baja más deprisa: se queda en la mitad de la mitad.",
      },
      {
        id: "quarter",
        label: "Se queda en un cuarto: ×¼",
        explanation: "Así es. A doble distancia, la fuerza es la cuarta parte.",
      },
      {
        id: "unchanged",
        misconception: "force-ignores-distance",
        label: "No cambia, porque las masas son las mismas",
        explanation:
          "Las masas son las mismas, pero la distancia también cuenta. Al separar los cuerpos, la fuerza se debilita.",
      },
      {
        id: "vanishes",
        misconception: "gravity-vanishes-far-away",
        label: "Desaparece, porque están demasiado lejos",
        explanation:
          "Se debilita, pero no llega a cero. Por muy lejos que estén dos cuerpos, siempre queda algo de atracción.",
      },
    ],
    correctOptionId: "quarter",
    takeaway:
      "Piensa en un espray de pintura. A doble distancia, la mancha es el doble de ancha y el doble de alta: la misma pintura se reparte en cuatro veces más superficie, y cada trozo recibe un cuarto. Con la gravedad pasa lo mismo. Por eso la distancia va al cuadrado.",
    invitation:
      "Compruébalo: lleva la distancia de 4 a 8 y mira el número. Luego bájala a 2: a mitad de distancia, la fuerza es ×4.",
    tutorPrompts: {
      pending: [
        "¿Distancia entre qué puntos de los cuerpos?",
        "Dame una pista sin decirme la respuesta",
      ],
      answered: [
        "¿Por qué la distancia va al cuadrado y no al cubo?",
        "Enséñame en la mesa qué pasa con el triple de distancia",
      ],
    },
  },
];

export type PredictionResult = {
  isCorrect: boolean;
  explanation: string;
};

export function gradePrediction(
  step: Step,
  optionId: string,
): PredictionResult {
  const option = step.options.find(({ id }) => id === optionId);
  if (!option) {
    throw new Error(`El paso "${step.id}" no tiene la opción "${optionId}"`);
  }
  return {
    isCorrect: option.id === step.correctOptionId,
    explanation: option.explanation,
  };
}
