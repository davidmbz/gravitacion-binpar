import { relativeForce, SCENE_LIMITS, type Scene } from "./scene";

// Canvas no lee clases de Tailwind: son los mismos valores que globals.css.
const COLORS = {
  stage: "#f6f7f1",
  ink: "#1b2233",
  prussian: "#1f4e79",
  cinnabar: "#a92c1c",
  verdigris: "#1f6655",
};

// Con estos dos valores, dos cuerpos de masa máxima no se solapan a la distancia
// mínima: 0,47 + 0,47 · 1,1 = 0,987 unidades.
const MAX_RADIUS_IN_UNITS = 0.47;
const DIAMOND_SCALE = 1.1;

/** Margen a cada lado, en unidades: justo lo que ocupa el cuerpo mayor. */
const SIDE_MARGIN_IN_UNITS = 0.6;

/** Espacio reservado abajo para la regla y su etiqueta. */
const RULE_SPACE = 44;

/** Por debajo de este ancho, los textos flotantes alcanzan a los cuerpos. */
const NARROW_WIDTH = 640;

/** Alto de esos textos: fórmula, multiplicador y nota del resultado. */
const OVERLAY_HEIGHT = 72;

/** Separación entre un cuerpo y el carril de su flecha. */
const LANE_GAP = 16;

/** Alto que ocupa, por fuera del carril, la etiqueta del cuerpo. */
const LABEL_HEIGHT = 14;

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

export type TableBand = {
  /** Primer píxel libre de textos flotantes. */
  top: number;
  axisY: number;
  ruleY: number;
  /** Mayor unidad con la que cuerpos, flechas y etiquetas caben en el alto. */
  maxUnit: number;
};

/** Reparte el alto: encima, los textos flotantes; debajo, la regla. */
export function computeBand(width: number, height: number): TableBand {
  const top = width < NARROW_WIDTH ? OVERLAY_HEIGHT : 0;
  const usable = height - RULE_SPACE - top;
  return {
    top,
    axisY: top + usable / 2,
    ruleY: height - RULE_SPACE + 8,
    maxUnit:
      (usable - 2 * (LANE_GAP + LABEL_HEIGHT)) /
      (2 * MAX_RADIUS_IN_UNITS * DIAMOND_SCALE),
  };
}

export function computeLayout(
  width: number,
  scene: Scene,
  maxUnit: number = Infinity,
): TableLayout {
  // La distancia va a escala real. Normalmente manda el ancho, pero en una mesa
  // muy baja manda el alto: si no, los cuerpos y sus etiquetas no cabrían.
  const unit = Math.min(
    width / (SCENE_LIMITS.distance.max + 2 * SIDE_MARGIN_IN_UNITS),
    maxUnit,
  );
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

function drawBody(
  context: CanvasRenderingContext2D,
  traceShape: () => void,
  color: string,
) {
  context.save();
  context.fillStyle = color;
  traceShape();
  context.fill();
  context.restore();
}

/**
 * Contorno de la escena de referencia, encima de los cuerpos: un cuerpo que ha
 * crecido lo taparía. El halo claro hace que se lea también sobre el relleno.
 */
function drawOutline(
  context: CanvasRenderingContext2D,
  traceShape: () => void,
  color: string,
) {
  context.save();
  context.strokeStyle = COLORS.stage;
  context.lineWidth = 3.5;
  traceShape();
  context.stroke();
  context.strokeStyle = color;
  context.lineWidth = 1.5;
  context.setLineDash([5, 4]);
  traceShape();
  context.stroke();
  context.restore();
}

/** Marca hasta dónde llegaba la flecha en la escena de referencia. */
function drawArrowMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  context.save();
  context.strokeStyle = COLORS.stage;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x, y - 10);
  context.lineTo(x, y + 10);
  context.stroke();
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 2;
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
  const headLength = Math.min(16, length);
  const headHalfWidth = Math.max(headLength / 2, 4);
  const tipX = x + direction * length;
  const headBaseX = tipX - direction * headLength;

  context.save();
  context.strokeStyle = COLORS.cinnabar;
  context.fillStyle = COLORS.cinnabar;

  context.lineWidth = 4;
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
    context.strokeStyle = COLORS.stage;
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
  context.lineWidth = 1.5;
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
  /** Escena con la que comparar. Null si no hay nada que comparar. */
  reference: Scene | null;
  fontFamily: string;
};

export function drawTable(
  context: CanvasRenderingContext2D,
  { width, height, scene, forcesVisible, reference, fontFamily }: DrawOptions,
) {
  const { axisY, ruleY, maxUnit } = computeBand(width, height);
  const layout = computeLayout(width, scene, maxUnit);
  const { xA, xB, radiusA, halfDiagonalB, arrow } = layout;

  // Cada flecha va en su propio carril: así se ven enteras aunque se crucen.
  const maxExtent = MAX_RADIUS_IN_UNITS * layout.unit * DIAMOND_SCALE;
  const laneA = axisY - maxExtent - LANE_GAP;
  const laneB = axisY + maxExtent + LANE_GAP;

  context.clearRect(0, 0, width, height);

  drawBody(
    context,
    () => traceCircle(context, xA, axisY, radiusA),
    COLORS.prussian,
  );
  drawBody(
    context,
    () => traceDiamond(context, xB, axisY, halfDiagonalB),
    COLORS.verdigris,
  );

  const before = reference && computeLayout(width, reference, maxUnit);
  if (before) {
    drawOutline(
      context,
      () => traceCircle(context, before.xA, axisY, before.radiusA),
      COLORS.prussian,
    );
    drawOutline(
      context,
      () => traceDiamond(context, before.xB, axisY, before.halfDiagonalB),
      COLORS.verdigris,
    );
  }

  context.font = `italic 18px ${fontFamily}`;
  context.textAlign = "right";
  context.fillStyle = COLORS.prussian;
  context.fillText("A", xA - 8, laneA + 6);
  context.textAlign = "left";
  context.fillStyle = COLORS.verdigris;
  context.fillText("B", xB + 8, laneB + 6);

  if (forcesVisible) {
    drawStem(context, xA, axisY - radiusA, laneA);
    drawStem(context, xB, axisY + halfDiagonalB, laneB);
    drawArrow(context, xA, laneA, 1, arrow);
    drawArrow(context, xB, laneB, -1, arrow);

    if (before) {
      drawArrowMark(context, xA + before.arrow.length, laneA);
      drawArrowMark(context, xB - before.arrow.length, laneB);
    }

    if (arrow.isClipped) {
      context.font = `15px ${fontFamily}`;
      context.fillStyle = COLORS.cinnabar;
      context.textAlign = "left";
      context.fillText("no cabe a escala", xA, laneA - 10);
    }
  }

  context.font = `italic 15px ${fontFamily}`;
  drawDistanceRule(context, layout, scene.distance, ruleY);
}
