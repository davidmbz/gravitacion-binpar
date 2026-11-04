"use client";

import { useEffect } from "react";

/**
 * En iOS el teclado no encoge 100dvh, solo el viewport visual. Publica ese alto
 * en --app-height para que la pantalla se ajuste y no tape el campo de texto.
 */
export function useViewportHeight(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;
    const update = () => {
      root.style.setProperty("--app-height", `${viewport.height}px`);
    };

    update();
    viewport.addEventListener("resize", update);
    return () => {
      viewport.removeEventListener("resize", update);
      root.style.removeProperty("--app-height");
    };
  }, []);
}
