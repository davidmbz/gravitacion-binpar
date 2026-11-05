import type { Frame } from "./trajectory";

/**
 * Orden de las láminas y frase que invita a abrir cada una. Con este orden, las
 * seis encajan sin huecos tanto en cuatro columnas como en dos, y el orden
 * visual coincide con el de teclado en ambos casos.
 */
export const GALLERY_TILES = [
  {
    slug: "lagrange",
    teaser: "Un triángulo perfecto que gira sin deformarse.",
  },
  {
    slug: "goggles",
    teaser: "La primera en descontrolarse: aguanta unos seis periodos.",
  },
  {
    slug: "figura-de-ocho",
    teaser: "Tres cuerpos persiguiéndose por la misma curva.",
  },
  {
    slug: "butterfly-i",
    teaser: "Pasan casi rozándose y salen disparados.",
  },
  { slug: "moth-i", teaser: "Grandes bucles que se cruzan sin parar." },
  {
    slug: "yin-yang-i",
    teaser: "La más larga: tarda unas 17 unidades de tiempo en repetirse.",
  },
] as const;

/** Por encima de esta proporción, la curva se aprovecha mejor en doble ancho. */
const WIDE_TILE_RATIO = 1.6;

export function isWideFrame({ width, height }: Frame): boolean {
  return width / height > WIDE_TILE_RATIO;
}
