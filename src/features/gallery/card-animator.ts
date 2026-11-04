import { prefersReducedMotion } from "@/components/use-reduced-motion";
import { findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit, type OrbitSamples } from "@/lib/physics/sampling";
import { paintOrbit, sizeCanvas, startLoop } from "./paint-orbit";
import type { Frame } from "./trajectory";

const CARD_STYLE = { bodyRadius: 4, trailDuration: 0.5 };

/** La muestra de la tarjeta no necesita tanto detalle como la del reproductor. */
const CARD_INTERVALS = 1024;

// Un solo bucle por construcción: empezar una tarjeta detiene la anterior.
let active: { canvas: HTMLCanvasElement; stop: () => void } | null = null;

const samplesBySlug = new Map<string, OrbitSamples>();

function samplesFor(slug: string): OrbitSamples {
  const cached = samplesBySlug.get(slug);
  if (cached) return cached;

  const orbit = findOrbit(slug);
  if (!orbit) throw new Error(`Órbita desconocida: ${slug}`);
  const samples = sampleOrbit(orbit, CARD_INTERVALS);
  samplesBySlug.set(slug, samples);
  return samples;
}

export function animateCard(
  canvas: HTMLCanvasElement,
  slug: string,
  frame: Frame,
): void {
  if (active?.canvas === canvas || prefersReducedMotion()) return;
  if (active) stopCard(active.canvas);

  const samples = samplesFor(slug);
  sizeCanvas(canvas);

  let phase = 0;
  const stop = startLoop((seconds) => {
    phase = (phase + seconds / samples.period) % 1;
    paintOrbit(canvas, samples, phase, frame, CARD_STYLE);
  });
  active = { canvas, stop };
}

export function stopCard(canvas: HTMLCanvasElement): void {
  if (active?.canvas !== canvas) return;
  active.stop();
  active = null;
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}
