import type { Metadata } from "next";

export const metadata: Metadata = { title: "Órbitas" };

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl sm:text-4xl">Seis órbitas de tres cuerpos</h1>
    </div>
  );
}
