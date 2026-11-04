import type { Metadata } from "next";
import { LearnExperience } from "@/features/learn/learn-experience";

export const metadata: Metadata = { title: "Aprende" };

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl sm:text-4xl">Aprende la ley</h1>
      <p className="mt-3 max-w-prose text-lg">
        Cuatro pasos para entender con cuánta fuerza se atraen dos cuerpos y por
        qué la Luna no se cae. En cada uno, primero predices qué pasará y luego
        lo compruebas.
      </p>
      <LearnExperience />
    </div>
  );
}
