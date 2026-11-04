"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/components/use-reduced-motion";
import {
  paintOrbit,
  sizeCanvas,
  startLoop,
} from "@/features/gallery/paint-orbit";
import type { Frame } from "@/features/gallery/trajectory";
import { findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit, type OrbitSamples } from "@/lib/physics/sampling";

const HERO_STYLE = { bodyRadius: 9, trailDuration: 0.9, loops: true };

interface OrbitHeroProps {
  slug: string;
  frame: Frame;
  children: ReactNode;
}

export function OrbitHero({ slug, frame, children }: OrbitHeroProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const samplesRef = useRef<OrbitSamples | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const orbit = findOrbit(slug);
    if (!canvas || !orbit) return;

    // La preferencia de movimiento cambia al hidratar: el efecto corre dos veces.
    const samples = (samplesRef.current ??= sampleOrbit(orbit));
    const paint = () =>
      paintOrbit(canvas, samples, phaseRef.current, frame, HERO_STYLE);

    const resizer = new ResizeObserver(() => {
      sizeCanvas(canvas);
      paint();
    });
    resizer.observe(canvas);

    if (reducedMotion) return () => resizer.disconnect();

    // Fuera de pantalla no hay nada que animar.
    let stopLoop: (() => void) | null = null;
    const visibility = new IntersectionObserver(([entry]) => {
      stopLoop?.();
      stopLoop = entry.isIntersecting
        ? startLoop((seconds) => {
            phaseRef.current =
              (phaseRef.current + seconds / samples.duration) % 1;
            paint();
          })
        : null;
    });
    visibility.observe(canvas);

    return () => {
      stopLoop?.();
      visibility.disconnect();
      resizer.disconnect();
    };
  }, [slug, frame, reducedMotion]);

  return (
    <div
      className="relative w-full text-ink/35"
      style={{ aspectRatio: frame.width / frame.height }}
    >
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
