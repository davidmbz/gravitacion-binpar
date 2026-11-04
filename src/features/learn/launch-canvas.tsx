"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/use-reduced-motion";
import { startLoop } from "@/features/gallery/paint-orbit";
import type { Launch, MoonFlight } from "@/lib/physics/moon-launch";
import { drawLaunch } from "./draw-launch";
import { describeOutcome, formatLaunch } from "./launch-text";

export type FlightState =
  | { status: "ready" }
  | { status: "flying"; flight: MoonFlight }
  | { status: "landed"; flight: MoonFlight };

const MAX_DEVICE_PIXEL_RATIO = 2;

/** Unidades de tiempo simuladas por segundo: un vuelo completo dura ~7 s. */
const PLAYBACK_RATE = 4;

type LaunchCanvasProps = {
  launch: Launch;
  flight: FlightState;
  onLanded: () => void;
};

export function LaunchCanvas({ launch, flight, onLanded }: LaunchCanvasProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Tiempo simulado ya reproducido. */
  const elapsedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const moon = flight.status === "ready" ? null : flight.flight;

    const paint = () => {
      const totalPoints = moon ? moon.positions.length / 2 : 0;
      const progress = moon ? elapsedRef.current / moon.duration : 0;
      const visiblePoints = Math.min(
        totalPoints,
        Math.max(1, Math.ceil(progress * totalPoints)),
      );
      drawLaunch(context, {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        launch,
        positions: moon?.positions ?? null,
        visiblePoints,
        fontFamily: getComputedStyle(canvas).fontFamily,
      });
    };

    const observer = new ResizeObserver(() => {
      const ratio = Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      context.scale(ratio, ratio);
      paint();
    });
    observer.observe(canvas);

    if (flight.status !== "flying") {
      if (flight.status === "landed")
        elapsedRef.current = flight.flight.duration;
      else elapsedRef.current = 0;
      return () => observer.disconnect();
    }

    elapsedRef.current = 0;
    if (reducedMotion) {
      elapsedRef.current = flight.flight.duration;
      onLanded();
      return () => observer.disconnect();
    }

    const stop = startLoop((seconds) => {
      elapsedRef.current += seconds * PLAYBACK_RATE;
      paint();
      if (elapsedRef.current >= flight.flight.duration) onLanded();
    });

    return () => {
      stop();
      observer.disconnect();
    };
  }, [launch, flight, reducedMotion, onLanded]);

  const result =
    flight.status === "landed"
      ? ` ${describeOutcome(flight.flight.outcome)}`
      : "";

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Planeta en el centro y una luna en lo alto, con ${formatLaunch(launch)}.${result}`}
      className="block h-52 w-full sm:h-56 lg:h-72"
    />
  );
}
