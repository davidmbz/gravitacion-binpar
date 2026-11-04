import { describe, expect, it } from "vitest";
import {
  describeScene,
  formatMultiple,
  INITIAL_SCENE,
  relativeForce,
  SCENE_LIMITS,
} from "./scene";

describe("relativeForce", () => {
  it("vale 1 en la escena inicial", () => {
    expect(relativeForce(INITIAL_SCENE)).toBe(1);
  });

  it("es proporcional a cada masa", () => {
    const { massA, massB } = INITIAL_SCENE;
    expect(relativeForce({ ...INITIAL_SCENE, massA: massA * 2 })).toBe(2);
    expect(relativeForce({ ...INITIAL_SCENE, massB: massB * 2 })).toBe(2);
  });

  it("es proporcional al producto de las masas", () => {
    const { massA, massB } = INITIAL_SCENE;
    expect(
      relativeForce({ ...INITIAL_SCENE, massA: massA * 2, massB: massB * 2 }),
    ).toBe(4);
  });

  it("baja a un cuarto con el doble de distancia y sube a ×4 con la mitad", () => {
    const { distance } = INITIAL_SCENE;
    expect(relativeForce({ ...INITIAL_SCENE, distance: distance * 2 })).toBe(
      0.25,
    );
    expect(relativeForce({ ...INITIAL_SCENE, distance: distance / 2 })).toBe(4);
  });

  it("no cambia al intercambiar las masas", () => {
    const swapped = {
      ...INITIAL_SCENE,
      massA: INITIAL_SCENE.massB,
      massB: INITIAL_SCENE.massA,
    };
    expect(relativeForce(swapped)).toBe(relativeForce(INITIAL_SCENE));
  });
});

describe("escena inicial", () => {
  it("deja margen para duplicar cada valor y dividir la distancia entre dos", () => {
    const { mass, distance } = SCENE_LIMITS;
    expect(INITIAL_SCENE.massA * 2).toBeLessThanOrEqual(mass.max);
    expect(INITIAL_SCENE.massB * 2).toBeLessThanOrEqual(mass.max);
    expect(INITIAL_SCENE.distance * 2).toBeLessThanOrEqual(distance.max);
    expect(INITIAL_SCENE.distance / 2).toBeGreaterThanOrEqual(distance.min);
  });
});

describe("formatMultiple", () => {
  it("usa fracciones comunes cuando son exactas", () => {
    expect(formatMultiple(0.25)).toBe("×¼");
    expect(formatMultiple(0.5)).toBe("×½");
    expect(formatMultiple(0.75)).toBe("×¾");
  });

  it("muestra enteros sin decimales", () => {
    expect(formatMultiple(1)).toBe("×1");
    expect(formatMultiple(200)).toBe("×200");
  });

  it("usa coma decimal y tres cifras significativas", () => {
    expect(formatMultiple(1.3333333)).toBe("×1,33");
    expect(formatMultiple(0.02)).toBe("×0,02");
  });
});

describe("describeScene", () => {
  it("nombra los cuerpos por su forma y sus valores", () => {
    const text = describeScene(INITIAL_SCENE, true);
    expect(text).toContain("círculo, con masa 4");
    expect(text).toContain("rombo, con masa 2");
    expect(text).toContain("distancia de 4");
  });

  it("incluye el múltiplo de la fuerza cuando las flechas se ven", () => {
    const scene = { ...INITIAL_SCENE, distance: 8 };
    expect(describeScene(scene, true)).toContain("×¼");
  });

  it("no habla de la fuerza mientras las flechas están ocultas", () => {
    expect(describeScene(INITIAL_SCENE, false)).not.toContain("fuerza");
  });
});
