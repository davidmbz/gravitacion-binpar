import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <h1 className="text-3xl sm:text-4xl">Esta página no existe</h1>
      <p className="mt-4">
        Puedes volver a <Link href="/orbitas">las seis órbitas</Link>.
      </p>
    </div>
  );
}
