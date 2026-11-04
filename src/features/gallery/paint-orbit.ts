import { positionsAt, type OrbitSamples } from "@/lib/physics/sampling";
import { BODY_COUNT, POSITION_SIZE } from "@/lib/physics/three-body";
import type { Frame } from "./trajectory";

export const BODY_COLORS = ["#a92c1c", "#1f4e79", "#1f6655"];

const MAX_PIXEL_RATIO = 2;
const TRAIL_SEGMENTS = 40;

export interface PaintStyle {
  /** Radio del cuerpo en píxeles CSS. */
  bodyRadius: number;
  /** Duración de la estela, en unidades de tiempo de la simulación. */
  trailDuration: number;
  /** En un tramo que no se repite, la estela no debe saltar al final. */
  loops: boolean;
}

export function sizeCanvas(canvas: HTMLCanvasElement): void {
  const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
}

/**
 * Ejecuta `step` en cada fotograma con los segundos transcurridos y devuelve la
 * función que lo detiene. El reloj solo decide la fase de reproducción: nunca
 * un paso físico.
 */
export function startLoop(step: (seconds: number) => void): () => void {
  let frame = 0;
  let stopped = false;
  let previous: number | null = null;

  const tick = (now: number) => {
    step(previous === null ? 0 : (now - previous) / 1000);
    previous = now;
    // `step` puede detener el bucle desde dentro de este mismo fotograma.
    if (!stopped) frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
}

/** Pinta cuerpos y estela con el mismo encaje que el SVG: centrado y entero. */
export function paintOrbit(
  canvas: HTMLCanvasElement,
  samples: OrbitSamples,
  phase: number,
  frame: Frame,
  { bodyRadius, trailDuration, loops }: PaintStyle,
  /** Trayectoria de referencia: se dibuja en contorno, sin estela. */
  reference?: OrbitSamples,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const { width, height } = canvas;
  const scale = Math.min(width / frame.width, height / frame.height);
  const offsetX = (width - frame.width * scale) / 2;
  const offsetY = (height - frame.height * scale) / 2;
  const toX = (x: number) => offsetX + (x - frame.x) * scale;
  const toY = (y: number) => offsetY + (-y - frame.y) * scale;
  const ratio = width / canvas.clientWidth;

  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  // Estela: tramos cada vez más opacos hasta la posición actual.
  const trail: Float64Array[] = [];
  for (let segment = TRAIL_SEGMENTS; segment >= 0; segment--) {
    const past =
      phase - ((segment / TRAIL_SEGMENTS) * trailDuration) / samples.duration;
    const positions = new Float64Array(POSITION_SIZE);
    positionsAt(samples, loops ? past : Math.max(past, 0), positions);
    trail.push(positions);
  }

  for (let body = 0; body < BODY_COUNT; body++) {
    context.strokeStyle = BODY_COLORS[body];
    context.lineWidth = 3.5 * ratio;
    for (let i = 1; i < trail.length; i++) {
      context.globalAlpha = i / trail.length;
      context.beginPath();
      context.moveTo(
        toX(trail[i - 1][2 * body]),
        toY(trail[i - 1][2 * body + 1]),
      );
      context.lineTo(toX(trail[i][2 * body]), toY(trail[i][2 * body + 1]));
      context.stroke();
    }
  }
  context.globalAlpha = 1;

  if (reference) {
    const positions = new Float64Array(POSITION_SIZE);
    positionsAt(reference, phase, positions);
    context.lineWidth = 1.5 * ratio;
    for (let body = 0; body < BODY_COUNT; body++) {
      context.strokeStyle = BODY_COLORS[body];
      traceBody(
        context,
        body,
        toX(positions[2 * body]),
        toY(positions[2 * body + 1]),
        bodyRadius * ratio,
      );
      context.stroke();
    }
  }

  const current = trail[trail.length - 1];
  for (let body = 0; body < BODY_COUNT; body++) {
    context.fillStyle = BODY_COLORS[body];
    traceBody(
      context,
      body,
      toX(current[2 * body]),
      toY(current[2 * body + 1]),
      bodyRadius * ratio,
    );
    context.fill();
  }
}

/** Cada cuerpo tiene su forma: el color nunca es la única señal. */
function traceBody(
  context: CanvasRenderingContext2D,
  body: number,
  x: number,
  y: number,
  radius: number,
): void {
  context.beginPath();
  if (body === 0) {
    context.arc(x, y, radius, 0, 2 * Math.PI);
  } else if (body === 1) {
    context.moveTo(x, y - radius * 1.25);
    context.lineTo(x + radius * 1.25, y);
    context.lineTo(x, y + radius * 1.25);
    context.lineTo(x - radius * 1.25, y);
    context.closePath();
  } else {
    context.moveTo(x, y - radius * 1.3);
    context.lineTo(x + radius * 1.2, y + radius);
    context.lineTo(x - radius * 1.2, y + radius);
    context.closePath();
  }
}
