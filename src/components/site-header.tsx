"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  // La portada es una columna centrada. Las demás pantallas ocupan todo el ancho.
  const isHome = usePathname() === "/";

  return (
    <header className="app-header border-b border-rule">
      <div
        className={`flex h-full items-center justify-between gap-4 px-4 ${
          isHome ? "mx-auto max-w-6xl sm:px-8" : "lg:px-6"
        }`}
      >
        <Link href="/" className="text-xl text-ink italic no-underline">
          Gravitación
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
