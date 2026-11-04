/** Si los tres cuerpos recorren una misma curva o cada uno traza la suya. */
export type OrbitCurve = "shared" | "separate";

export interface Orbit {
  slug: string;
  name: string;
  curve: OrbitCurve;
  period: number;
  initialState: readonly number[];
  summary: string;
  source: { label: string; url: string };
}

/** Familia de Šuvakov y Dmitrašinović: cuerpos alineados y simetría de velocidades. */
function collinearState(p1: number, p2: number): number[] {
  return [-1, 0, 1, 0, 0, 0, p1, p2, p1, p2, -2 * p1, -2 * p2];
}

function figureEightState(): number[] {
  const x = 0.97000436;
  const y = -0.24308753;
  const vx = -0.93240737;
  const vy = -0.86473146;
  return [x, y, -x, -y, 0, 0, -vx / 2, -vy / 2, -vx / 2, -vy / 2, vx, vy];
}

/** Triángulo equilátero de radio 1: para que gire, v² = 1/√3. */
function lagrangeState(): number[] {
  const speed = 3 ** -0.25;
  const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  const positions = angles.flatMap((a) => [Math.cos(a), Math.sin(a)]);
  const velocities = angles.flatMap((a) => [
    -speed * Math.sin(a),
    speed * Math.cos(a),
  ]);
  return [...positions, ...velocities];
}

const SUVAKOV = {
  label: "Šuvakov y Dmitrašinović (2013)",
  url: "https://arxiv.org/abs/1303.0181",
};

const LI_LIAO = {
  label: "Li y Liao (2013), valores de 15 dígitos",
  url: "https://arxiv.org/abs/1312.6796",
};

export const ORBITS: readonly Orbit[] = [
  {
    slug: "lagrange",
    name: "Lagrange",
    curve: "shared",
    period: 2 * Math.PI * 3 ** 0.25,
    initialState: lagrangeState(),
    summary:
      "Un triángulo equilátero que gira sin deformarse. Es la solución más antigua, y la única de esta galería que se puede escribir con una fórmula.",
    source: {
      label: "Solución analítica de Lagrange (1772)",
      url: "https://es.wikipedia.org/wiki/Puntos_de_Lagrange",
    },
  },
  {
    slug: "figura-de-ocho",
    name: "Figura de ocho",
    curve: "shared",
    period: 6.32591398,
    initialState: figureEightState(),
    summary:
      "Los tres cuerpos se persiguen por una misma curva en forma de ocho, separados por un tercio de vuelta.",
    source: {
      label: "Chenciner y Montgomery (2000), valores de Simó",
      url: "https://arxiv.org/abs/math/0011268",
    },
  },
  {
    slug: "butterfly-i",
    name: "Butterfly I",
    curve: "separate",
    period: 6.23564136316479,
    initialState: collinearState(0.306892758965492, 0.125506782829762),
    summary:
      "Dos alas simétricas. Los cuerpos pasan muy cerca unos de otros y salen despedidos a gran velocidad.",
    source: LI_LIAO,
  },
  {
    slug: "goggles",
    name: "Goggles",
    curve: "separate",
    period: 10.4668176954385,
    initialState: collinearState(0.0833000564575194, 0.127889282226563),
    summary:
      "Dos lóbulos unidos por un puente, como unas gafas. Es la más sensible de las seis a cualquier error.",
    source: LI_LIAO,
  },
  {
    slug: "moth-i",
    name: "Moth I",
    curve: "separate",
    period: 14.8939,
    initialState: collinearState(0.46444, 0.39606),
    summary:
      "Una polilla de trazos amplios. Sus condiciones iniciales solo se publicaron con cinco decimales.",
    source: SUVAKOV,
  },
  {
    slug: "yin-yang-i",
    name: "Yin-Yang I",
    curve: "separate",
    period: 17.328369755004,
    initialState: collinearState(0.513938054919243, 0.304736003875733),
    summary:
      "Dos mitades que se envuelven. El catálogo tiene dos variantes: aquí se usa la a, que cierra mejor y aguanta más periodos.",
    source: LI_LIAO,
  },
];

export function findOrbit(slug: string): Orbit | undefined {
  return ORBITS.find((orbit) => orbit.slug === slug);
}
