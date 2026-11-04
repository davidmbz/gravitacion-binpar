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
import {
  compareWithPerturbed,
  COMPARISON_DURATION,
  type OrbitComparison,
} from "@/lib/physics/perturbation";
import { sampleOrbit, type OrbitSamples } from "@/lib/physics/sampling";
import {
  describeComparison,
  formatSeparation,
  formatTime,
} from "./comparison-text";
import { paintOrbit, sizeCanvas, startLoop } from "./paint-orbit";
import {
  frameOf,
  stageAspectRatio,
  unionFrames,
  viewBoxOf,
  type Frame,
} from "./trajectory";

type Playback = "playing" | "paused";

type PlayerView =
  | { kind: "periodic" }
  | { kind: "calculating" }
  | { kind: "comparison"; comparison: OrbitComparison; frame: Frame };

const SPEEDS = [0.25, 0.5, 1, 2] as const;
const SCRUB_STEPS = 1000;
const PLAYER_STYLE = { bodyRadius: 7, trailDuration: 0.5, loops: true };
const COMPARISON_STYLE = { ...PLAYER_STYLE, loops: false };

/** Margen para que el navegador pinte el aviso antes del cálculo. */
const PAINT_DELAY_MS = 50;

/** La fase 1 equivaldría a volver a 0: el tramo termina justo antes. */
const LAST_PHASE = 1 - 1e-9;

const secondaryButton =
  "min-h-11 cursor-pointer border border-rule px-4 hover:bg-paper-deep disabled:cursor-not-allowed disabled:text-ink-soft";

function loadOrbit(slug: string) {
  const orbit = findOrbit(slug);
  if (!orbit) throw new Error(`Órbita desconocida: ${slug}`);
  return orbit;
}

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
  const [view, setView] = useState<PlayerView>({ kind: "periodic" });
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const readoutRef = useRef<HTMLParagraphElement>(null);
  const samplesRef = useRef<OrbitSamples | null>(null);
  const phaseRef = useRef(0);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (view.kind === "comparison") {
      const { perturbed, original } = view.comparison;
      paintOrbit(
        canvas,
        perturbed,
        phaseRef.current,
        view.frame,
        COMPARISON_STYLE,
        original,
      );
    } else if (samplesRef.current) {
      paintOrbit(
        canvas,
        samplesRef.current,
        phaseRef.current,
        frame,
        PLAYER_STYLE,
      );
    }
  }, [frame, view]);

  const seekTo = useCallback(
    (phase: number) => {
      phaseRef.current = phase;
      if (scrubberRef.current) {
        scrubberRef.current.value = String(Math.round(phase * SCRUB_STEPS));
      }
      // Se escribe directo en el DOM: un render por fotograma no aporta nada.
      if (readoutRef.current && view.kind === "comparison") {
        const { separation } = view.comparison;
        const sample = Math.round(phase * (separation.length - 1));
        readoutRef.current.textContent = `Instante ${formatTime(phase * COMPARISON_DURATION)}. Separación: ${formatSeparation(separation[sample])}.`;
      }
      paint();
    },
    [paint, view],
  );

  // Integra un periodo al abrir. El bucle de pintado solo lee estas muestras:
  // nunca decide un paso físico.
  useEffect(() => {
    samplesRef.current ??= sampleOrbit(loadOrbit(slug));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      sizeCanvas(canvas);
      // Corre también al cambiar de vista: alinea barra y lectura aunque esté en pausa.
      seekTo(phaseRef.current);
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [slug, seekTo]);

  useEffect(() => {
    if (playback !== "playing") return;

    // Activity también ejecuta esta limpieza al ocultar la ruta.
    return startLoop((seconds) => {
      if (view.kind === "comparison") {
        const next = phaseRef.current + (seconds * speed) / COMPARISON_DURATION;
        seekTo(Math.min(next, LAST_PHASE));
        if (next >= LAST_PHASE) setChosenPlayback("paused");
      } else if (samplesRef.current) {
        const { duration } = samplesRef.current;
        seekTo((phaseRef.current + (seconds * speed) / duration) % 1);
      }
    });
  }, [playback, speed, seekTo, view]);

  /** El SVG viene del servidor: solo cambia su encuadre, no su trazado. */
  function frameFigure(target: Frame) {
    stageRef.current
      ?.querySelector("svg")
      ?.setAttribute("viewBox", viewBoxOf(target));
  }

  function perturb() {
    setView({ kind: "calculating" });
    // El cálculo bloquea el hilo: antes hay que dejar pintar el aviso. Sin
    // requestAnimationFrame, que no corre con la pestaña en segundo plano.
    setTimeout(() => {
      const comparison = compareWithPerturbed(loadOrbit(slug));
      const fullFrame = unionFrames(
        frame,
        frameOf(comparison.original),
        frameOf(comparison.perturbed),
      );
      frameFigure(fullFrame);
      phaseRef.current = 0;
      setView({ kind: "comparison", comparison, frame: fullFrame });
    }, PAINT_DELAY_MS);
  }

  function backToPeriodic() {
    frameFigure(frame);
    phaseRef.current = 0;
    setView({ kind: "periodic" });
  }

  function togglePlayback() {
    const atEnd = view.kind === "comparison" && phaseRef.current >= LAST_PHASE;
    if (playback === "paused" && atEnd) seekTo(0);
    setChosenPlayback(playback === "playing" ? "paused" : "playing");
  }

  return (
    <div>
      <div
        ref={stageRef}
        className={`relative w-full lg:min-h-72 ${
          view.kind === "comparison"
            ? "lg:max-h-[calc(100dvh-31rem)]"
            : "lg:max-h-[calc(100dvh-21rem)]"
        }`}
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
          onClick={togglePlayback}
          className="min-h-11 min-w-24 cursor-pointer border border-ink px-4 hover:bg-paper-deep"
        >
          {playback === "playing" ? "Pausar" : "Reproducir"}
        </button>
        <button
          type="button"
          onClick={() => seekTo(0)}
          className={secondaryButton}
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
        {view.kind === "comparison" ? (
          <button
            type="button"
            onClick={backToPeriodic}
            className={secondaryButton}
          >
            Sin perturbar
          </button>
        ) : (
          <button
            type="button"
            disabled={view.kind === "calculating"}
            onClick={perturb}
            className={secondaryButton}
          >
            Perturbar
          </button>
        )}
        <label className="flex w-full items-center gap-3">
          {view.kind === "comparison"
            ? "Momento de la simulación"
            : "Momento del periodo"}
          <input
            ref={scrubberRef}
            type="range"
            min={0}
            max={SCRUB_STEPS}
            defaultValue={0}
            onChange={(event) =>
              seekTo(
                Math.min(Number(event.target.value) / SCRUB_STEPS, LAST_PHASE),
              )
            }
            className="min-h-11 flex-1 accent-prussian"
          />
        </label>
      </div>

      <div role="status" className="mt-3 empty:hidden">
        {view.kind === "calculating" && (
          <p className="italic">Calculando las dos trayectorias</p>
        )}
        {view.kind === "comparison" && (
          <>
            <p>{describeComparison(view.comparison)}</p>
            <p className="mt-2 text-ink-soft">
              Relleno: órbita perturbada. Contorno: la misma órbita sin
              perturbar. Es una sola prueba en un tiempo limitado, y parte de la
              separación puede ser desfase.
            </p>
          </>
        )}
      </div>
      {view.kind === "comparison" && (
        <p ref={readoutRef} aria-hidden="true" className="mt-2 italic" />
      )}
    </div>
  );
}
