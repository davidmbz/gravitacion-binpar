import {
  LAUNCH_RADIUS,
  PLANET_RADIUS,
  type Launch,
} from "@/lib/physics/moon-launch";

// Canvas no lee clases de Tailwind: son los mismos valores que globals.css.
const COLORS = {
  ink: "#1b2233",
  planet: "#d3d9cc",
  moon: "#1f4e79",
  path: "#a92c1c",
};

/** Unidades visibles desde el centro hasta el borde superior. */
const VIEW_HALF_HEIGHT = 2.2;
/** En pantallas estrechas manda el ancho: la órbita circular debe caber entera. */
const VIEW_HALF_WIDTH = 1.5;
const ARROW_UNITS_PER_SPEED = 0.8;
const MOON_RADIUS = 7;
const ARROW_HEAD = 8;

type LaunchDrawing = {
  width: number;
  height: number;
  launch: Launch;
  /** Pares x, y del vuelo, o null si aún no se ha lanzado. */
  positions: Float64Array | null;
  visiblePoints: number;
  fontFamily: string;
};

export function drawLaunch(
  context: CanvasRenderingContext2D,
  {
    width,
    height,
    launch,
    positions,
    visiblePoints,
    fontFamily,
  }: LaunchDrawing,
): void {
  const scale = Math.min(
    height / (2 * VIEW_HALF_HEIGHT),
    width / (2 * VIEW_HALF_WIDTH),
  );
  const toX = (x: number) => width / 2 + x * scale;
  const toY = (y: number) => height / 2 - y * scale;

  context.clearRect(0, 0, width, height);

  context.beginPath();
  context.arc(toX(0), toY(0), PLANET_RADIUS * scale, 0, 2 * Math.PI);
  context.fillStyle = COLORS.planet;
  context.fill();
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = COLORS.ink;
  context.font = `italic 13px ${fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("planeta", toX(0), toY(0));

  let moonX = 0;
  let moonY = LAUNCH_RADIUS;

  if (positions) {
    context.beginPath();
    context.moveTo(toX(positions[0]), toY(positions[1]));
    for (let point = 1; point < visiblePoints; point++) {
      context.lineTo(toX(positions[2 * point]), toY(positions[2 * point + 1]));
    }
    context.strokeStyle = COLORS.path;
    context.lineWidth = 3;
    context.lineJoin = "round";
    context.stroke();
    moonX = positions[2 * (visiblePoints - 1)];
    moonY = positions[2 * (visiblePoints - 1) + 1];
  } else {
    drawAim(context, toX(moonX), toY(moonY), launch, scale);
  }

  context.beginPath();
  context.arc(toX(moonX), toY(moonY), MOON_RADIUS, 0, 2 * Math.PI);
  context.fillStyle = COLORS.moon;
  context.fill();
}

/** Flecha de lanzamiento: su longitud crece con la velocidad. */
function drawAim(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  { speed, angle }: Launch,
  scale: number,
): void {
  const radians = (angle * Math.PI) / 180;
  const length = speed * ARROW_UNITS_PER_SPEED * scale;
  const tipX = x + Math.cos(radians) * length;
  const tipY = y - Math.sin(radians) * length;

  context.strokeStyle = COLORS.path;
  context.fillStyle = COLORS.path;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(tipX, tipY);
  context.stroke();

  context.save();
  context.translate(tipX, tipY);
  context.rotate(-radians);
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-ARROW_HEAD, -ARROW_HEAD / 2);
  context.lineTo(-ARROW_HEAD, ARROW_HEAD / 2);
  context.closePath();
  context.fill();
  context.restore();
}
