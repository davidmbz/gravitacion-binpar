"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { rememberOpenedOrbit } from "./return-origin";

interface OrbitCardLinkProps {
  slug: string;
  children: ReactNode;
}

export function OrbitCardLink({ slug, children }: OrbitCardLinkProps) {
  return (
    <Link
      id={`orbita-${slug}`}
      href={`/orbitas/${slug}`}
      onNavigate={() => rememberOpenedOrbit(slug)}
      className="group block text-ink no-underline"
    >
      {children}
    </Link>
  );
}
