/**
 * Órbita abierta desde la galería. Vive en memoria del módulo: basta para el
 * viaje de ida y vuelta, y tras una recarga la vuelta es una navegación normal.
 */
let openedSlug: string | null = null;

export function rememberOpenedOrbit(slug: string): void {
  openedSlug = slug;
}

export function cameFromGallery(): boolean {
  return openedSlug !== null;
}

export function takeOpenedOrbit(): string | null {
  const slug = openedSlug;
  openedSlug = null;
  return slug;
}
