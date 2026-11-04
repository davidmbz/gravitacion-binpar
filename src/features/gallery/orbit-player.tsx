"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { findOrbit } from "@/lib/physics/orbits";
import {
  positionsAt,
  sampleOrbit,
  type OrbitSamples,
} from "@/lib/physics/sampling";
import { BODY_COUNT, POSITION_SIZE } from "@/lib/physics/three-body";

type Playback = "playing" | "paused";

const SPEEDS = [0.25, 0.5, 1, 2] as const;

/** A velocidad 1, un segundo de pantalla son 1 unidad de tiempo de la simulación. */
const BASE_RATE = 1;
const TRAIL_SEGMENTS = 40;
/** Duración de la estela, en unidades de tiempo de la simulación. */
const TRAIL_DURATION = 0.5;
const MAX_PIXEL_RATIO = 2;
const SCRUB_STEPS = 1000;

const BODY_COLORS = ["#a92c1c", "#1f4e79", "#1f6655"];
const BODY_RADIUS = 7;

interface OrbitPlayerProps {
  slug: string;
  halfSize: number;
  name: string;
  children: React.ReactNode;
}

export function OrbitPlayer({
  slug,
  halfSize,
  name,
  children,
}: OrbitPlayerProps) {
  const reducedMotion = useReducedMotion();
  // Sin elección de la persona, la preferencia del sistema decide si arranca.
  const [chosenPlayback, setChosenPlayback] = useState<Playback | null>(null);
  const playback = chosenPlayback ?? (reducedMotion ? "paused" : "playing");
  const [speed, setSpeed] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const samplesRef = useRef<OrbitSamples | null>(null);
  const phaseRef = useRef(0);

  // Integra un periodo al abrir. El bucle de pintado solo lee estas muestras:
  // nunca decide un paso físico.
  useEffect(() => {
    const orbit = findOrbit(slug);
    if (!orbit) throw new Error(`Órbita desconocida: ${slug}`);
    samplesRef.current ??= sampleOrbit(orbit);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      paint(canvas, samplesRef.current, phaseRef.current, halfSize);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [slug, halfSize]);

  useEffect(() => {
    if (playback !== "playing") return;

    let frame = 0;
    let previous: number | null = null;

    const tick = (now: number) => {
      const samples = samplesRef.current;
      const canvas = canvasRef.current;
      if (samples && canvas) {
        const seconds = previous === null ? 0 : (now - previous) / 1000;
        phaseRef.current =
          (phaseRef.current + (seconds * speed * BASE_RATE) / samples.period) %
          1;
        paint(canvas, samples, phaseRef.current, halfSize);
        if (scrubberRef.current) {
          scrubberRef.current.value = String(
            Math.round(phaseRef.current * SCRUB_STEPS),
          );
        }
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    // Activity también ejecuta esta limpieza al ocultar la ruta.
    return () => cancelAnimationFrame(frame);
  }, [playback, speed, halfSize]);

  function seek(phase: number) {
    phaseRef.current = phase;
    if (scrubberRef.current) {
      scrubberRef.current.value = String(Math.round(phase * SCRUB_STEPS));
    }
    if (canvasRef.current) {
      paint(canvasRef.current, samplesRef.current, phase, halfSize);
    }
  }

  return (
    <div>
      <div className="relative text-ink/30">
        {children}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 size-full"
        />
      </div>

      <div
        role="group"
        aria-label={`Controles de reproducción de ${name}`}
        className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3"
      >
        <button
          type="button"
          onClick={() =>
            setChosenPlayback(playback === "playing" ? "paused" : "playing")
          }
          className="min-h-11 min-w-24 border border-ink px-4 hover:bg-paper-deep"
        >
          {playback === "playing" ? "Pausar" : "Reproducir"}
        </button>
        <button
          type="button"
          onClick={() => seek(0)}
          className="min-h-11 border border-rule px-4 hover:bg-paper-deep"
        >
          Reiniciar
        </button>
        <label className="flex items-center gap-2">
          Velocidad
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="min-h-11 border border-rule bg-paper px-2"
          >
            {SPEEDS.map((value) => (
              <option key={value} value={value}>
                {value.toLocaleString("es-ES")}×
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full items-center gap-3">
          Momento del periodo
          <input
            ref={scrubberRef}
            type="range"
            min={0}
            max={SCRUB_STEPS}
            defaultValue={0}
            onChange={(event) => seek(Number(event.target.value) / SCRUB_STEPS)}
            className="min-h-11 flex-1 accent-prussian"
          />
        </label>
      </div>
    </div>
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** En el servidor no se conoce la preferencia: se asume la opción sin movimiento. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
}

function paint(
  canvas: HTMLCanvasElement,
  samples: OrbitSamples | null,
  phase: number,
  halfSize: number,
): void {
  const context = canvas.getContext("2d");
  if (!context || !samples) return;

  const { width, height } = canvas;
  const scale = width / (2 * halfSize);
  const toX = (x: number) => (x + halfSize) * scale;
  const toY = (y: number) => (halfSize - y) * scale;
  const ratio = width / canvas.clientWidth;
  const positions = new Float64Array(POSITION_SIZE);

  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  // Estela: tramos cada vez más opacos hasta la posición actual.
  const trail: Float64Array[] = [];
  for (let segment = TRAIL_SEGMENTS; segment >= 0; segment--) {
    const past =
      phase - ((segment / TRAIL_SEGMENTS) * TRAIL_DURATION) / samples.period;
    positionsAt(samples, past, positions);
    trail.push(positions.slice());
  }

  for (let body = 0; body < BODY_COUNT; body++) {
    context.strokeStyle = BODY_COLORS[body];
    context.lineWidth = 2.5 * ratio;
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

  const current = trail[trail.length - 1];
  for (let body = 0; body < BODY_COUNT; body++) {
    context.fillStyle = BODY_COLORS[body];
    drawBody(
      context,
      body,
      toX(current[2 * body]),
      toY(current[2 * body + 1]),
      BODY_RADIUS * ratio,
    );
  }
}

/** Cada cuerpo tiene su forma: el color nunca es la única señal. */
function drawBody(
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
  context.fill();
}
