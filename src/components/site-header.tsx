import Link from "next/link";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-4 py-1 sm:px-8">
        <Link href="/" className="text-xl text-ink italic no-underline">
          Gravitación
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
