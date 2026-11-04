import {
  formatMultiple,
  relativeForce,
  SCENE_LIMITS,
  type Scene,
} from "./scene";

// Canvas no lee clases de Tailwind: son los mismos valores que globals.css.
const COLORS = {
  paper: "#eef0e8",
  ink: "#1b2233",
  prussian: "#1f4e79",
  cinnabar: "#a92c1c",
  verdigris: "#1f6655",
};

// Con estos dos valores, dos cuerpos de masa máxima no se solapan a la distancia
// mínima: 0,42 + 0,42 · 1,25 = 0,945 unidades.
const MAX_RADIUS_IN_UNITS = 0.42;
const DIAMOND_SCALE = 1.25;

// Con esta escala, ×¼ aún se ve en móvil y ×4 cabe a cualquier distancia.
const ARROW_UNITS_PER_MULTIPLE = 0.75;
const MIN_ARROW_LENGTH = 5;

type ArrowSize = { length: number; isClipped: boolean };

export type TableLayout = {
  unit: number;
  xA: number;
  xB: number;
  radiusA: number;
  halfDiagonalB: number;
  arrow: ArrowSize;
};

function bodyRadius(mass: number, unit: number): number {
  // Raíz cúbica: a igual densidad, el volumen de una esfera crece con la masa.
  return MAX_RADIUS_IN_UNITS * unit * Math.cbrt(mass / SCENE_LIMITS.mass.max);
}

// La longitud es lineal con la fuerza para que ×4 se vea cuatro veces mayor.
// Los extremos se recortan: el rango va de ×0,02 a ×200 y no cabe entero.
function arrowSize(
  multiple: number,
  unit: number,
  available: number,
): ArrowSize {
  const length = multiple * ARROW_UNITS_PER_MULTIPLE * unit;
  return {
    length: Math.min(Math.max(length, MIN_ARROW_LENGTH), available),
    isClipped: length > available,
  };
}

export function computeLayout(width: number, scene: Scene): TableLayout {
  // Una unidad de margen a cada lado. La distancia va a escala real.
  const unit = width / (SCENE_LIMITS.distance.max + 2);
  const separation = scene.distance * unit;
  const xA = width / 2 - separation / 2;
  const xB = width / 2 + separation / 2;
  const availableForArrow = width - unit - xA;

  return {
    unit,
    xA,
    xB,
    radiusA: bodyRadius(scene.massA, unit),
    halfDiagonalB: bodyRadius(scene.massB, unit) * DIAMOND_SCALE,
    arrow: arrowSize(relativeForce(scene), unit, availableForArrow),
  };
}

function traceCircle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
}

function traceDiamond(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfDiagonal: number,
) {
  context.beginPath();
  context.moveTo(x, y - halfDiagonal);
  context.lineTo(x + halfDiagonal, y);
  context.lineTo(x, y + halfDiagonal);
  context.lineTo(x - halfDiagonal, y);
  context.closePath();
}

// Rayado a 45 grados, como el sombreado de un grabado.
function hatch(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  extent: number,
) {
  const spacing = 4;
  context.lineWidth = 1;
  context.beginPath();
  for (let offset = -2 * extent; offset <= 2 * extent; offset += spacing) {
    context.moveTo(x + offset - extent, y + extent);
    context.lineTo(x + offset + extent, y - extent);
  }
  context.stroke();
}

function drawBody(
  context: CanvasRenderingContext2D,
  traceShape: () => void,
  color: string,
  x: number,
  y: number,
  extent: number,
) {
  context.save();
  context.strokeStyle = color;
  context.fillStyle = COLORS.paper;

  traceShape();
  context.fill();

  context.save();
  traceShape();
  context.clip();
  hatch(context, x, y, extent);
  context.restore();

  traceShape();
  context.lineWidth = 1.5;
  context.stroke();
  context.restore();
}

/** `direction` es 1 hacia la derecha y -1 hacia la izquierda. */
function drawArrow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 1 | -1,
  { length, isClipped }: ArrowSize,
) {
  const headLength = Math.min(11, length);
  const headHalfWidth = Math.max(headLength / 2, 3);
  const tipX = x + direction * length;
  const headBaseX = tipX - direction * headLength;

  context.save();
  context.strokeStyle = COLORS.cinnabar;
  context.fillStyle = COLORS.cinnabar;

  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(headBaseX, y);
  context.stroke();

  context.beginPath();
  context.moveTo(tipX, y);
  context.lineTo(headBaseX, y - headHalfWidth);
  context.lineTo(headBaseX, y + headHalfWidth);
  context.closePath();
  context.fill();

  if (isClipped) {
    // Corte en la flecha, como el de un eje partido: aquí la escala se rompe.
    const breakX = headBaseX - direction * 14;
    context.strokeStyle = COLORS.paper;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(breakX - 3, y + 7);
    context.lineTo(breakX + 3, y - 7);
    context.stroke();
  }
  context.restore();
}

function drawStem(
  context: CanvasRenderingContext2D,
  x: number,
  fromY: number,
  toY: number,
) {
  context.save();
  context.strokeStyle = COLORS.cinnabar;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, fromY);
  context.lineTo(x, toY);
  context.stroke();
  context.restore();
}

function drawDistanceRule(
  context: CanvasRenderingContext2D,
  { xA, xB, unit }: TableLayout,
  distance: number,
  y: number,
) {
  context.save();
  context.strokeStyle = COLORS.ink;
  context.fillStyle = COLORS.ink;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(xA, y);
  context.lineTo(xB, y);
  for (let mark = 0; mark <= distance; mark += 1) {
    const isEnd = mark === 0 || mark === distance;
    const halfHeight = isEnd ? 6 : 3;
    context.moveTo(xA + mark * unit, y - halfHeight);
    context.lineTo(xA + mark * unit, y + halfHeight);
  }
  context.stroke();
  context.textAlign = "center";
  context.fillText(`distancia ${distance}`, (xA + xB) / 2, y + 22);
  context.restore();
}

type DrawOptions = {
  width: number;
  height: number;
  scene: Scene;
  forcesVisible: boolean;
  fontFamily: string;
};

export function drawTable(
  context: CanvasRenderingContext2D,
  { width, height, scene, forcesVisible, fontFamily }: DrawOptions,
) {
  const layout = computeLayout(width, scene);
  const { xA, xB, radiusA, halfDiagonalB, arrow } = layout;
  const axisY = height * 0.42;

  // Cada flecha va en su propio carril: así se ven enteras aunque se crucen.
  const maxExtent = MAX_RADIUS_IN_UNITS * layout.unit * DIAMOND_SCALE;
  const laneA = axisY - maxExtent - 12;
  const laneB = axisY + maxExtent + 12;

  context.clearRect(0, 0, width, height);

  drawBody(
    context,
    () => traceCircle(context, xA, axisY, radiusA),
    COLORS.prussian,
    xA,
    axisY,
    radiusA,
  );
  drawBody(
    context,
    () => traceDiamond(context, xB, axisY, halfDiagonalB),
    COLORS.verdigris,
    xB,
    axisY,
    halfDiagonalB,
  );

  context.font = `italic 16px ${fontFamily}`;
  context.textAlign = "right";
  context.fillStyle = COLORS.prussian;
  context.fillText("A", xA - 7, laneA + 5);
  context.textAlign = "left";
  context.fillStyle = COLORS.verdigris;
  context.fillText("B", xB + 7, laneB + 5);

  if (forcesVisible) {
    drawStem(context, xA, axisY - radiusA, laneA);
    drawStem(context, xB, axisY + halfDiagonalB, laneB);
    drawArrow(context, xA, laneA, 1, arrow);
    drawArrow(context, xB, laneB, -1, arrow);

    const multiple = formatMultiple(relativeForce(scene));
    const label = arrow.isClipped ? `${multiple}, no cabe a escala` : multiple;
    context.font = `15px ${fontFamily}`;
    context.fillStyle = COLORS.cinnabar;
    context.textAlign = "left";
    context.fillText(label, xA, laneA - 8);
    context.textAlign = "right";
    context.fillText(label, xB, laneB + 20);
  }

  context.font = `italic 15px ${fontFamily}`;
  drawDistanceRule(context, layout, scene.distance, height - 34);
}
