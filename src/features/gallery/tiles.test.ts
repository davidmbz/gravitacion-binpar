import { describe, expect, it } from "vitest";
import { findOrbit, ORBITS } from "@/lib/physics/orbits";
import { sampleOrbit } from "@/lib/physics/sampling";
import { GALLERY_TILES, isWideFrame } from "./tiles";
import { frameOf } from "./trajectory";

function spanOf(slug: string): number {
  const orbit = findOrbit(slug);
  if (!orbit) throw new Error(`Órbita desconocida: ${slug}`);
  return isWideFrame(frameOf(sampleOrbit(orbit, 1024))) ? 2 : 1;
}

describe("GALLERY_TILES", () => {
  it("incluye cada órbita una sola vez", () => {
    const slugs = GALLERY_TILES.map(({ slug }) => slug);
    expect([...slugs].sort()).toEqual(ORBITS.map(({ slug }) => slug).sort());
  });

  it("las dos órbitas alargadas son las láminas anchas", () => {
    const wide = GALLERY_TILES.filter(({ slug }) => spanOf(slug) === 2);
    expect(wide.map(({ slug }) => slug)).toEqual([
      "figura-de-ocho",
      "butterfly-i",
    ]);
  });

  it.each([
    ["escritorio", 4, 2],
    ["móvil", 2, 4],
  ])(
    "en %s, las seis llenan %i columnas sin huecos",
    (_name, columns, rows) => {
      let used = 0;
      for (const { slug } of GALLERY_TILES) {
        const span = spanOf(slug);
        // Una lámina no debe saltar de fila dejando un hueco.
        expect((used % columns) + span).toBeLessThanOrEqual(columns);
        used += span;
      }
      expect(used).toBe(rows * columns);
    },
  );
});
