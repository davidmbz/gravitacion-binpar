import type { Frame } from "./trajectory";

/**
 * Orden de las láminas y frase que invita a abrir cada una. Con este orden, las
 * seis encajan sin huecos tanto en cuatro columnas como en dos, y el orden
 * visual coincide con el de teclado en ambos casos.
 */
export const GALLERY_TILES = [
  { slug: "lagrange", teaser: "¿Puede un triángulo girar sin deformarse?" },
  { slug: "goggles", teaser: "La primera en desviarse. ¿Cuánto aguanta?" },
  {
    slug: "figura-de-ocho",
    teaser: "Tres cuerpos, una sola curva. ¿Quién sigue a quién?",
  },
  { slug: "butterfly-i", teaser: "Casi chocan y salen despedidos. Míralo." },
  { slug: "moth-i", teaser: "Trazos amplios y encuentros más suaves." },
  { slug: "yin-yang-i", teaser: "La que más tarda en repetirse." },
] as const;

/** Por encima de esta proporción, la curva se aprovecha mejor en doble ancho. */
const WIDE_TILE_RATIO = 1.6;

export function isWideFrame({ width, height }: Frame): boolean {
  return width / height > WIDE_TILE_RATIO;
}
