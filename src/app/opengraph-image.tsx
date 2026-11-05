import {
  renderShareImage,
  SHARE_IMAGE_MIN_STEP,
  SHARE_IMAGE_SIZE,
  SHARE_IMAGE_TYPE,
} from "@/features/gallery/share-image";
import { buildTrajectory } from "@/features/gallery/trajectory";
import { findOrbit } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";

export const alt = "Tres cuerpos siguiendo una curva en forma de ocho";
export const size = SHARE_IMAGE_SIZE;
export const contentType = SHARE_IMAGE_TYPE;

export default function HomeImage() {
  const orbit = findOrbit("figura-de-ocho");
  if (!orbit) throw new Error("Falta la figura de ocho en el catálogo");

  return renderShareImage({
    title: "Todo lo que tiene masa se atrae.",
    titleSize: 64,
    subtitle: "La ley de Newton, para probarla con tus manos",
    trajectory: buildTrajectory(
      sampleOrbit(orbit),
      SHARE_IMAGE_MIN_STEP,
      1 / 3,
    ),
  });
}
