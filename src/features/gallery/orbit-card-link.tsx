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
      className="group block text-ink no-underline"
    >
      <div className="relative aspect-square border border-rule bg-paper-deep/50 p-3 group-hover:border-ink">
        {figure}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-3 size-[calc(100%-1.5rem)]"
        />
      </div>
      {children}
    </Link>
  );
}
