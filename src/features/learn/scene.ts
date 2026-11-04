export type Scene = {
  massA: number;
  massB: number;
  distance: number;
};

export const SCENE_LIMITS = {
  mass: { min: 1, max: 10 },
  distance: { min: 1, max: 10 },
} as const;

// Masas distintas para que el paso 1 tenga sentido desde el principio. Con
// distancia 4 caben a la vez el doble (8) y la mitad (2) dentro de los límites.
export const INITIAL_SCENE: Scene = { massA: 4, massB: 2, distance: 4 };

function forceWithoutG({ massA, massB, distance }: Scene): number {
  return (massA * massB) / distance ** 2;
}

// G se cancela al dividir entre la escena inicial: por eso no hace falta su
// valor y la app puede trabajar en unidades relativas.
export function relativeForce(scene: Scene): number {
  return forceWithoutG(scene) / forceWithoutG(INITIAL_SCENE);
}

const COMMON_FRACTIONS = [
  { value: 0.25, text: "¼" },
  { value: 0.5, text: "½" },
  { value: 0.75, text: "¾" },
];

const FRACTION_TOLERANCE = 1e-9;

const multipleFormat = new Intl.NumberFormat("es", {
  maximumSignificantDigits: 3,
});

export function formatMultiple(multiple: number): string {
  const fraction = COMMON_FRACTIONS.find(
    ({ value }) => Math.abs(multiple - value) < FRACTION_TOLERANCE,
  );
  return `×${fraction ? fraction.text : multipleFormat.format(multiple)}`;
}

// Alternativa textual del canvas. Sin flechas tampoco se nombra la fuerza: hasta
// responder al paso 1, el texto delataría la respuesta igual que el dibujo.
export function describeScene(scene: Scene, forcesVisible: boolean): string {
  const bodies = `Cuerpo A, un círculo, con masa ${scene.massA}. Cuerpo B, un rombo, con masa ${scene.massB}. Separados por una distancia de ${scene.distance}.`;
  if (!forcesVisible) return bodies;
  const multiple = formatMultiple(relativeForce(scene));
  return `${bodies} Cada cuerpo recibe una flecha de fuerza hacia el otro, las dos iguales: ${multiple} respecto a la escena inicial.`;
}
