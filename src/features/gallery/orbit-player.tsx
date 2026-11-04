"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "@/components/use-reduced-motion";
import { findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit, type OrbitSamples } from "@/lib/physics/sampling";
import { paintOrbit, sizeCanvas, startLoop } from "./paint-orbit";
import { stageAspectRatio, type Frame } from "./trajectory";

type Playback = "playing" | "paused";

const SPEEDS = [0.25, 0.5, 1, 2] as const;
const SCRUB_STEPS = 1000;
const PLAYER_STYLE = { bodyRadius: 7, trailDuration: 0.5 };

interface OrbitPlayerProps {
  slug: string;
  frame: Frame;
  name: string;
  children: ReactNode;
}

export function OrbitPlayer({ slug, frame, name, children }: OrbitPlayerProps) {
  const reducedMotion = useReducedMotion();
  // Sin elección de la persona, la preferencia del sistema decide si arranca.
  const [chosenPlayback, setChosenPlayback] = useState<Playback | null>(null);
  const playback = chosenPlayback ?? (reducedMotion ? "paused" : "playing");
  const [speed, setSpeed] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const samplesRef = useRef<OrbitSamples | null>(null);
  const phaseRef = useRef(0);

  const paint = useCallback(() => {
    if (canvasRef.current && samplesRef.current) {
      paintOrbit(
        canvasRef.current,
        samplesRef.current,
        phaseRef.current,
        frame,
        PLAYER_STYLE,
      );
    }
  }, [frame]);

  const seekTo = useCallback(
    (phase: number) => {
      phaseRef.current = phase;
      if (scrubberRef.current) {
        scrubberRef.current.value = String(Math.round(phase * SCRUB_STEPS));
      }
      paint();
    },
    [paint],
  );

  // Integra un periodo al abrir. El bucle de pintado solo lee estas muestras:
  // nunca decide un paso físico.
  useEffect(() => {
    const orbit = findOrbit(slug);
    if (!orbit) throw new Error(`Órbita desconocida: ${slug}`);
    samplesRef.current ??= sampleOrbit(orbit);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      sizeCanvas(canvas);
      paint();
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [slug, paint]);

  useEffect(() => {
    if (playback !== "playing") return;

    // Activity también ejecuta esta limpieza al ocultar la ruta.
    return startLoop((seconds) => {
      const samples = samplesRef.current;
      if (!samples) return;
      seekTo((phaseRef.current + (seconds * speed) / samples.period) % 1);
    });
  }, [playback, speed, seekTo]);

  return (
    <div>
      <div
        className="relative w-full lg:max-h-[calc(100dvh-21rem)] lg:min-h-72"
        style={{ aspectRatio: stageAspectRatio(frame) }}
      >
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
          onClick={() => seekTo(0)}
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
            onChange={(event) =>
              seekTo(Number(event.target.value) / SCRUB_STEPS)
            }
            className="min-h-11 flex-1 accent-prussian"
          />
        </label>
      </div>
    </div>
  );
}
