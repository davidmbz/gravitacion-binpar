import Link from "next/link";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="app-header border-b border-rule">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="text-xl text-ink italic no-underline">
          Gravitación
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
