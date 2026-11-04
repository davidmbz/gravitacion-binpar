"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/aprende", label: "Aprende" },
  { href: "/orbitas", label: "Órbitas" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal">
      <ul className="flex gap-6">
        {LINKS.map(({ href, label }) => {
          const isCurrent = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "text-ink underline decoration-cinnabar decoration-2"
                    : "text-ink no-underline hover:underline"
                }
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
