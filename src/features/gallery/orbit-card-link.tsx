"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { animateCard, stopCard } from "./card-animator";
import { rememberOpenedOrbit } from "./return-origin";
import type { Frame } from "./trajectory";

interface OrbitCardLinkProps {
  slug: string;
  frame: Frame;
  figure: ReactNode;
  children: ReactNode;
}

export function OrbitCardLink({
  slug,
  frame,
  figure,
  children,
}: OrbitCardLinkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function start() {
    if (canvasRef.current) animateCard(canvasRef.current, slug, frame);
  }

  function stop() {
    if (canvasRef.current) stopCard(canvasRef.current);
  }

  // También corre al ocultar la ruta con Activity: no queda un bucle huérfano.
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) stopCard(canvas);
    };
  }, []);

  return (
    <Link
      id={`orbita-${slug}`}
      href={`/orbitas/${slug}`}
      onNavigate={() => rememberOpenedOrbit(slug)}
      // En pantallas táctiles no hay hover: la tarjeta queda estática.
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") start();
      }}
      onPointerLeave={(event) => {
        if (!event.currentTarget.matches(":focus-visible")) stop();
      }}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) start();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.matches(":hover")) stop();
      }}
      className="group flex h-full flex-col rounded-md border border-rule bg-stage text-ink no-underline transition-colors duration-150 hover:border-ink"
    >
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-2">{figure}</div>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-2 size-[calc(100%-1rem)]"
        />
      </div>
      <div className="px-3 pb-2.5">{children}</div>
    </Link>
  );
}
