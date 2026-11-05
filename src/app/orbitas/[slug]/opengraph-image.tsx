import { notFound } from "next/navigation";
import {
  renderShareImage,
  SHARE_IMAGE_MIN_STEP,
  SHARE_IMAGE_SIZE,
  SHARE_IMAGE_TYPE,
} from "@/features/gallery/share-image";
import { buildTrajectory } from "@/features/gallery/trajectory";
import { ORBITS, findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";

export const alt = "Trayectoria de una órbita de tres cuerpos";
export const size = SHARE_IMAGE_SIZE;
export const contentType = SHARE_IMAGE_TYPE;

export function generateStaticParams() {
  return ORBITS.map(({ slug }) => ({ slug }));
}

export default async function OrbitImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const orbit = findOrbit(slug);
  if (!orbit) notFound();

  return renderShareImage({
    title: orbit.name,
    titleSize: 84,
    subtitle: "Una órbita periódica de tres cuerpos",
    trajectory: buildTrajectory(
      sampleOrbit(orbit),
      SHARE_IMAGE_MIN_STEP,
      orbit.curve === "shared" ? 1 / 3 : 1,
    ),
  });
}
