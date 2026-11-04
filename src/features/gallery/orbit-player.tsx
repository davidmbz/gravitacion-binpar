"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { tabId, TabList, tabPanelId } from "@/components/tabs";
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
import { GalleryLink } from "./gallery-link";
import { frameOf, unionFrames, viewBoxOf, type Frame } from "./trajectory";

type Playback = "playing" | "paused";

type PlayerView =
  | { kind: "periodic" }
  | { kind: "calculating" }
  | { kind: "comparison"; comparison: OrbitComparison; frame: Frame };

const SPEEDS = [0.25, 0.5, 1, 2] as const;
const SCRUB_STEPS = 1000;
const PLAYER_STYLE = { bodyRadius: 9, trailDuration: 0.6, loops: true };
const COMPARISON_STYLE = { ...PLAYER_STYLE, loops: false };

/** Margen para que el navegador pinte el aviso antes del cálculo. */
const PAINT_DELAY_MS = 50;

/** La fase 1 equivaldría a volver a 0: el tramo termina justo antes. */
const LAST_PHASE = 1 - 1e-9;

const TABS_ID = "orbit";

const BASE_TABS = [
  { id: "about", label: "Órbita" },
  { id: "limits", label: "Límites de la animación" },
] as const;

const PERTURBATION_TAB = { id: "perturbation", label: "Perturbación" } as const;

type PlayerTab =
  (typeof BASE_TABS)[number]["id"] | (typeof PERTURBATION_TAB)["id"];

const iconButton =
  "inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-md transition-colors duration-150 hover:bg-paper-deep";

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <path d="M5 3 L17 10 L5 17 Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <path d="M4 3 H8 V17 H4 Z M12 3 H16 V17 H12 Z" fill="currentColor" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10 a6 6 0 1 0 2 -4.5" />
      <path d="M6 2 V6 H2" />
    </svg>
  );
}

function loadOrbit(slug: string) {
  const orbit = findOrbit(slug);
  if (!orbit) throw new Error(`Órbita desconocida: ${slug}`);
  return orbit;
}

interface OrbitPlayerProps {
  slug: string;
  frame: Frame;
  name: string;
  /** Trayectoria estática, generada en el servidor. */
  figure: ReactNode;
  /** Contenido de las pestañas: también llega hecho desde el servidor. */
  about: ReactNode;
  limits: ReactNode;
}

export function OrbitPlayer({
  slug,
  frame,
  name,
  figure,
  about,
  limits,
}: OrbitPlayerProps) {
  const reducedMotion = useReducedMotion();
  // Sin elección de la persona, la preferencia del sistema decide si arranca.
  const [chosenPlayback, setChosenPlayback] = useState<Playback | null>(null);
  const playback = chosenPlayback ?? (reducedMotion ? "paused" : "playing");
  const [speed, setSpeed] = useState<number>(1);
  const [view, setView] = useState<PlayerView>({ kind: "periodic" });
  const [tab, setTab] = useState<PlayerTab>("about");
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
    setTab("perturbation");
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
    setTab("about");
  }

  function togglePlayback() {
    const atEnd = view.kind === "comparison" && phaseRef.current >= LAST_PHASE;
    if (playback === "paused" && atEnd) seekTo(0);
    setChosenPlayback(playback === "playing" ? "paused" : "playing");
  }

  const isPeriodic = view.kind === "periodic";
  const tabs = isPeriodic ? BASE_TABS : [...BASE_TABS, PERTURBATION_TAB];

  return (
    <div className="app-screen flex flex-col lg:flex-row">
      <section
        aria-label={`Simulación de ${name}`}
        className="flex min-h-0 flex-[0_0_55%] flex-col lg:relative lg:flex-1"
      >
        <div className="stage-grid relative min-h-0 flex-1">
          <div className="absolute top-1 left-3 z-10 lg:top-3 lg:left-6">
            <GalleryLink className="inline-flex min-h-11 items-center">
              Volver a la galería
            </GalleryLink>
            <h1 className="text-2xl leading-tight lg:text-4xl">{name}</h1>
          </div>

          {view.kind === "comparison" && (
            <p
              ref={readoutRef}
              aria-hidden="true"
              className="absolute top-3 right-3 z-10 max-w-44 text-right leading-snug text-cinnabar tabular-nums lg:top-5 lg:right-6 lg:max-w-none lg:text-xl"
            />
          )}

          {/* Mismo recuadro para el SVG y el canvas: así los cuerpos caen sobre
              la línea. Abajo, en escritorio, deja sitio a la barra flotante. */}
          <div
            ref={stageRef}
            className="absolute inset-x-3 top-20 bottom-2 lg:inset-x-8 lg:top-24 lg:bottom-28"
          >
            {figure}
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="absolute inset-0 size-full"
            />
          </div>
        </div>

        <div
          role="group"
          aria-label={`Controles de reproducción de ${name}`}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-rule bg-paper px-3 py-2 lg:absolute lg:inset-x-6 lg:bottom-5 lg:flex-nowrap lg:rounded-md lg:border lg:shadow-[0_8px_24px_#1b223322]"
        >
          <button
            type="button"
            aria-label={playback === "playing" ? "Pausar" : "Reproducir"}
            onClick={togglePlayback}
            className={`${iconButton} bg-ink text-paper hover:bg-prussian`}
          >
            {playback === "playing" ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            aria-label="Reiniciar"
            onClick={() => seekTo(0)}
            className={iconButton}
          >
            <RestartIcon />
          </button>
          <label className="flex min-h-11 items-center">
            <span className="sr-only">Velocidad</span>
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="min-h-11 w-16 cursor-pointer rounded-md bg-transparent px-1 hover:bg-paper-deep"
            >
              {SPEEDS.map((value) => (
                <option key={value} value={value}>
                  {value.toLocaleString("es-ES")}×
                </option>
              ))}
            </select>
          </label>
          <label className="order-last flex min-h-11 w-full items-center lg:order-none lg:w-auto lg:flex-1 lg:px-2">
            <span className="sr-only">
              {view.kind === "comparison"
                ? "Momento de la simulación"
                : "Momento del periodo"}
            </span>
            <input
              ref={scrubberRef}
              type="range"
              min={0}
              max={SCRUB_STEPS}
              defaultValue={0}
              onChange={(event) =>
                seekTo(
                  Math.min(
                    Number(event.target.value) / SCRUB_STEPS,
                    LAST_PHASE,
                  ),
                )
              }
              className="h-11 w-full cursor-pointer accent-prussian"
            />
          </label>
          {view.kind === "comparison" ? (
            <button
              type="button"
              onClick={backToPeriodic}
              className="ml-auto inline-flex min-h-11 flex-none cursor-pointer items-center rounded-md border border-cinnabar px-4 text-cinnabar transition-colors duration-150 hover:bg-paper-deep lg:ml-0"
            >
              Sin perturbar
            </button>
          ) : (
            <button
              type="button"
              disabled={view.kind === "calculating"}
              onClick={perturb}
              className="ml-auto inline-flex min-h-11 flex-none cursor-pointer items-center rounded-md bg-cinnabar px-5 text-paper transition-colors duration-150 hover:bg-ink disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-soft lg:ml-0"
            >
              Perturbar
            </button>
          )}
        </div>
      </section>

      <aside
        aria-label="Información de la órbita"
        className="safe-bottom flex min-h-0 flex-1 flex-col border-t border-rule bg-paper lg:w-[24rem] lg:flex-none lg:border-t-0 lg:border-l"
      >
        <div className="border-b border-rule px-1">
          <TabList
            label="Información de la órbita"
            tabs={tabs}
            active={tab}
            idPrefix={TABS_ID}
            onChange={setTab}
          />
        </div>

        <div
          id={tabPanelId(TABS_ID, "about")}
          role="tabpanel"
          aria-labelledby={tabId(TABS_ID, "about")}
          hidden={tab !== "about"}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
        >
          {about}
        </div>

        <div
          id={tabPanelId(TABS_ID, "limits")}
          role="tabpanel"
          aria-labelledby={tabId(TABS_ID, "limits")}
          hidden={tab !== "limits"}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
        >
          {limits}
        </div>

        {!isPeriodic && (
          <div
            id={tabPanelId(TABS_ID, "perturbation")}
            role="tabpanel"
            aria-labelledby={tabId(TABS_ID, "perturbation")}
            hidden={tab !== "perturbation"}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
          >
            <div role="status">
              {view.kind === "calculating" ? (
                <p className="italic">Calculando las dos trayectorias</p>
              ) : (
                <>
                  <p className="text-lg leading-snug">
                    {describeComparison(view.comparison)}
                  </p>
                  <p className="mt-3 text-ink-soft">
                    Relleno: órbita perturbada. Contorno: la misma órbita sin
                    perturbar. Es una sola prueba en un tiempo limitado, y parte
                    de la separación puede ser desfase.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
