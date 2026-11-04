"use client";

import { useEffect, useRef } from "react";
import { drawTable } from "./draw-table";
import type { Scene } from "./scene";

const MAX_DEVICE_PIXEL_RATIO = 2;

type TableCanvasProps = {
  scene: Scene;
  forcesVisible: boolean;
  description: string;
};

export function TableCanvas({
  scene,
  forcesVisible,
  description,
}: TableCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    // Sin contexto 2D quedan la descripción y los controles, que no dependen de él.
    if (!canvas || !context) return;

    const paint = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.scale(ratio, ratio);
      drawTable(context, {
        width,
        height,
        scene,
        forcesVisible,
        fontFamily: getComputedStyle(canvas).fontFamily,
      });
    };

    // El observador avisa nada más empezar a observar, así que cubre tanto el
    // primer dibujo y los cambios de estado como los de tamaño.
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);

    // Si la fuente llega tarde, el primer dibujo habrá usado la de reserva.
    let isCurrent = true;
    document.fonts.ready.then(() => {
      if (isCurrent) paint();
    });

    return () => {
      isCurrent = false;
      observer.disconnect();
    };
  }, [scene, forcesVisible]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={description}
      className="block h-44 w-full sm:h-56 lg:h-72"
    />
  );
}
