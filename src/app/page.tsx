import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-20">
      <h1 className="text-4xl leading-tight sm:text-6xl">
        Dos cuerpos cualesquiera se atraen.
      </h1>
      <p className="mt-6 max-w-prose text-lg">
        Newton lo resumió en una sola ley. Compruébala moviendo masas con tus
        manos y mira después lo que ocurre cuando entra un tercer cuerpo.
      </p>
      <ul className="mt-8 flex flex-col gap-3 text-lg sm:flex-row sm:gap-8">
        <li>
          <Link href="/aprende">Aprender la ley</Link>
        </li>
        <li>
          <Link href="/orbitas">Ver las seis órbitas</Link>
        </li>
      </ul>
    </div>
  );
}
