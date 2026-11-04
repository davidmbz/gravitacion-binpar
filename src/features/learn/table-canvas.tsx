"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/use-reduced-motion";
import { startLoop } from "@/features/gallery/paint-orbit";
import { drawTable } from "./draw-table";
import { sameScene, type Scene } from "./scene";

const MAX_DEVICE_PIXEL_RATIO = 2;

/** Curva suave en los dos extremos: los cuerpos ya están en pantalla y se mueven. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

function mixScenes(from: Scene, to: Scene, t: number): Scene {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    massA: mix(from.massA, to.massA),
    massB: mix(from.massB, to.massB),
    distance: mix(from.distance, to.distance),
  };
}

type TableCanvasProps = {
  scene: Scene;
  forcesVisible: boolean;
  reference: Scene | null;
  /** Duración de la transición hacia la nueva escena. */
  transitionMs: number;
  description: string;
};

export function TableCanvas({
  scene,
  forcesVisible,
  reference,
  transitionMs,
  description,
}: TableCanvasProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Escena dibujada ahora mismo: durante una transición no es la del estado. */
  const shownRef = useRef(scene);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    // Sin contexto 2D quedan la descripción y los controles, que no dependen de él.
    if (!canvas || !context) return;

    const paint = () => {
      const ratio = canvas.width / canvas.clientWidth;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawTable(context, {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        scene: shownRef.current,
        forcesVisible,
        reference,
        fontFamily: getComputedStyle(canvas).fontFamily,
      });
    };

    const from = shownRef.current;
    const animates = !reducedMotion && !sameScene(from, scene);
    if (!animates) shownRef.current = scene;

    // El observador avisa nada más empezar a observar: cubre el primer dibujo.
    const observer = new ResizeObserver(() => {
      const ratio = Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      paint();
    });
    observer.observe(canvas);

    // Si la fuente llega tarde, el primer dibujo habrá usado la de reserva.
    let isCurrent = true;
    document.fonts.ready.then(() => {
      if (isCurrent) paint();
    });

    let elapsed = 0;
    const stopTransition = animates
      ? startLoop((seconds) => {
          elapsed += seconds * 1000;
          const t = Math.min(elapsed / transitionMs, 1);
          shownRef.current = mixScenes(from, scene, easeInOut(t));
          paint();
          if (t === 1) stopTransition?.();
        })
      : null;

    return () => {
      isCurrent = false;
      stopTransition?.();
      observer.disconnect();
    };
  }, [scene, forcesVisible, reference, transitionMs, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={description}
      className="absolute inset-0 size-full"
    />
  );
}
