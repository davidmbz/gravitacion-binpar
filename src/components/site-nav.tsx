"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GalleryLink } from "@/features/gallery/gallery-link";

function linkClass(isCurrent: boolean): string {
  return isCurrent
    ? "inline-block py-2 text-ink underline decoration-cinnabar decoration-2"
    : "inline-block py-2 text-ink no-underline hover:underline";
}

export function SiteNav() {
  const pathname = usePathname();
  const inLearn = pathname.startsWith("/aprende");
  const inOrbits = pathname.startsWith("/orbitas");

  return (
    <nav aria-label="Principal">
      <ul className="flex gap-6">
        <li>
          <Link
            href="/aprende"
            aria-current={inLearn ? "page" : undefined}
            className={linkClass(inLearn)}
          >
            Aprende
          </Link>
        </li>
        <li>
          <GalleryLink
            aria-current={inOrbits ? "page" : undefined}
            className={linkClass(inOrbits)}
          >
            Órbitas
          </GalleryLink>
        </li>
      </ul>
    </nav>
  );
}
