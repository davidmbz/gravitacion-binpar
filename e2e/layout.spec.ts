import { expect, test, type Page } from "@playwright/test";
import {
  CORRECT_ANSWERS,
  openTutor,
  predict,
  reachClosing,
} from "./learn-helpers";

const SCREENS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
];

async function expectNoPageScroll(page: Page) {
  const overflow = await page.evaluate(() => ({
    vertical: document.documentElement.scrollHeight - window.innerHeight,
    horizontal: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect(overflow).toEqual({ vertical: 0, horizontal: 0 });
}

for (const size of SCREENS) {
  test.describe(`${size.width} × ${size.height}`, () => {
    test.use({ viewport: size });

    test("Aprende no hace scroll en ninguna fase", async ({ page }) => {
      await page.goto("/aprende");
      await expectNoPageScroll(page);

      await predict(page, CORRECT_ANSWERS[0]);
      await expectNoPageScroll(page);

      await page.getByRole("button", { name: "Probarlo yo" }).click();
      await expectNoPageScroll(page);

      await openTutor(page);
      await expectNoPageScroll(page);
    });

    test("la galería muestra las seis órbitas sin scroll", async ({ page }) => {
      await page.goto("/orbitas");
      await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");
      await expectNoPageScroll(page);

      const cards = page.getByRole("main").getByRole("link");
      await expect(cards).toHaveCount(6);
      for (const card of await cards.all()) {
        await expect(card).toBeInViewport({ ratio: 1 });
      }
    });

    test("el detalle no hace scroll y mantiene los controles", async ({
      page,
    }) => {
      for (const slug of ["butterfly-i", "yin-yang-i", "lagrange"]) {
        await page.goto(`/orbitas/${slug}`);
        await expectNoPageScroll(page);
        await expect(
          page.getByRole("slider", { name: "Momento del periodo" }),
        ).toBeInViewport({ ratio: 1 });
        await expect(
          page.getByRole("button", { name: "Perturbar", exact: true }),
        ).toBeInViewport({ ratio: 1 });
      }
    });

    test("el detalle sigue sin scroll al perturbar y al ver los límites", async ({
      page,
    }) => {
      await page.goto("/orbitas/goggles");
      await page.getByRole("tab", { name: "Límites" }).click();
      await expect(
        page.getByRole("heading", { name: "Lo que esta animación no es" }),
      ).toBeVisible();
      await expectNoPageScroll(page);

      await page
        .getByRole("button", { name: "Perturbar", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("100 veces mayor");
      await expectNoPageScroll(page);
    });

    test("el filtro comparte fila con el título", async ({ page }) => {
      await page.goto("/orbitas");
      await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");
      const title = await page.getByRole("heading", { level: 1 }).boundingBox();
      const filter = await page
        .getByRole("radio", { name: "Todas" })
        .boundingBox();
      expect(filter?.x).toBeGreaterThan((title?.x ?? 0) + (title?.width ?? 0));
    });

    test("filtrar la galería no estira las láminas", async ({ page }) => {
      await page.goto("/orbitas");
      await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");
      const card = page.getByRole("link", { name: /Lagrange/ });
      const before = await card.boundingBox();

      await page.getByRole("radio", { name: "Curva compartida" }).check();
      await expect(page.getByRole("status")).toHaveText("2 de 6 órbitas");

      const after = await card.boundingBox();
      expect(after?.height).toBeCloseTo(before?.height ?? 0, 0);
      await expectNoPageScroll(page);
    });

    test("Aprende mantiene el cierre sin scroll", async ({ page }) => {
      await reachClosing(page);
      await expectNoPageScroll(page);
    });
  });
}

// Altos reales con las barras del navegador, además de los de pantalla.
for (const viewport of [
  { width: 280, height: 653 },
  { width: 320, height: 568 },
  { width: 375, height: 553 },
  { width: 390, height: 664 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
]) {
  test(`a ${viewport.width} × ${viewport.height}, el cierre cabe en la mesa`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await reachClosing(page);

    const fits = await page.evaluate(() => {
      const stage = document.querySelector("section[aria-label='Simulación']");
      const formula = stage?.querySelector(".phase-in");
      if (!stage || !formula) return null;
      const outer = stage.getBoundingClientRect();
      const inner = formula.getBoundingClientRect();
      return {
        vertical: inner.top >= outer.top && inner.bottom <= outer.bottom,
        horizontal: inner.left >= outer.left && inner.right <= outer.right,
      };
    });
    expect(fits).toEqual({ vertical: true, horizontal: true });

    // El numerador en una línea: si se parte, la fracción se descoloca.
    const fraction = page.locator(".phase-in .border-b.border-ink");
    const lineHeight = await fraction.evaluate((element) => {
      const { fontSize } = getComputedStyle(element);
      return element.getBoundingClientRect().height / parseFloat(fontSize);
    });
    expect(lineHeight).toBeLessThan(2);

    // La frase de la ley no se pierde: en columna vive en el panel.
    const law = page
      .getByText(/La fuerza crece con las masas/)
      .locator("visible=true");
    await expect(law).toHaveCount(1);
    await law.scrollIntoViewIfNeeded();
    await expect(law).toBeInViewport();
  });
}

test("en móvil, la órbita y sus controles quedan a la vista", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/orbitas/butterfly-i");
  await expect(
    page.getByRole("img", { name: /Trayectoria de los tres/ }),
  ).toBeInViewport({ ratio: 1 });
  for (const button of ["Pausar", "Reiniciar", "Perturbar"]) {
    const target = page.getByRole("button", { name: button, exact: true });
    await expect(target).toBeInViewport({ ratio: 1 });
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await expectNoPageScroll(page);
});

for (const width of [1440, 1920]) {
  test(`a ${width} px, la cabecera se alinea con el contenido`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const logo = page.getByRole("link", { name: "Gravitación" });

    await page.goto("/orbitas");
    const title = page.getByRole("heading", { level: 1 });
    expect((await logo.boundingBox())?.x).toBe((await title.boundingBox())?.x);

    await page.goto("/orbitas/goggles");
    const back = page.getByRole("link", { name: "Volver a la galería" });
    expect((await logo.boundingBox())?.x).toBe((await back.boundingBox())?.x);
  });
}

test("la portada mantiene la cabecera en su columna", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  const logo = await page
    .getByRole("link", { name: "Gravitación" })
    .boundingBox();
  const title = await page.getByRole("heading", { level: 1 }).boundingBox();
  expect(logo?.x).toBe(title?.x);
});

test("al perturbar, las tres pestañas caben en una fila a 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/orbitas/lagrange");
  await page.getByRole("button", { name: "Perturbar", exact: true }).click();

  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(3);
  const rows = new Set<number | undefined>();
  for (const tab of await tabs.all()) {
    rows.add((await tab.boundingBox())?.y);
  }
  expect(rows.size).toBe(1);
});

test("el filtro de la galería muestra el foco de teclado", async ({ page }) => {
  await page.goto("/orbitas");
  await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");

  // El radio real es invisible: el contorno lo dibuja su etiqueta.
  await page.getByRole("link", { name: "Órbitas" }).focus();
  await page.keyboard.press("Tab");
  const radio = page.getByRole("radio", { name: "Todas" });
  await expect(radio).toBeFocused();

  const outline = await radio.evaluate((input) => {
    const label = input.closest("label");
    return label ? getComputedStyle(label).outlineStyle : "sin etiqueta";
  });
  expect(outline).toBe("solid");
});

test.describe("en móvil", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("el filtro cabe en una línea", async ({ page }) => {
    await page.goto("/orbitas");
    await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");
    const first = await page
      .getByRole("radio", { name: "Todas" })
      .boundingBox();
    const last = await page
      .getByRole("radio", { name: "Curva propia" })
      .boundingBox();
    expect(last?.y).toBe(first?.y);
  });
});

test.describe("con zoom del 200 %", () => {
  // 1280 × 720 al 200 % deja 640 × 360 píxeles CSS.
  test.use({ viewport: { width: 640, height: 360 } });

  for (const { path, action } of [
    { path: "/aprende", action: "Comprobar mi predicción" },
    { path: "/orbitas/goggles", action: "Perturbar" },
  ]) {
    test(`${path} sigue siendo usable`, async ({ page }) => {
      await page.goto(path);
      const target = page.getByRole("button", { name: action, exact: true });
      await target.scrollIntoViewIfNeeded();
      await expect(target).toBeInViewport();

      const { horizontal } = await page.evaluate(() => ({
        horizontal: document.documentElement.scrollWidth - window.innerWidth,
      }));
      expect(horizontal).toBe(0);
    });
  }

  test("/orbitas llega hasta la última lámina", async ({ page }) => {
    await page.goto("/orbitas");
    await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");
    const last = page.getByRole("link", { name: /Yin-Yang I/ });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
  });
});

test.describe("en una ventana baja", () => {
  test.use({ viewport: { width: 1280, height: 420 } });

  test("la página recupera el scroll y no pierde contenido", async ({
    page,
  }) => {
    await page.goto("/aprende");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(overflow).toBeGreaterThan(0);

    const action = page.getByRole("button", {
      name: "Comprobar mi predicción",
    });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport();
  });
});
