import { expect, test, type Page } from "@playwright/test";
import {
  CORRECT_ANSWERS,
  completeStep,
  openTutor,
  predict,
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
      await page.getByRole("tab", { name: "Límites de la animación" }).click();
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
      await page.goto("/aprende");
      for (const answer of CORRECT_ANSWERS.slice(0, 3)) {
        await completeStep(page, answer);
        await page.getByRole("button", { name: "Paso siguiente" }).click();
      }
      await completeStep(page, CORRECT_ANSWERS[3]);
      await page
        .getByRole("button", { name: "Ver lo que has demostrado" })
        .click();
      await expect(page.getByText(/Has acertado 4 de 4/)).toBeVisible();
      await expectNoPageScroll(page);
    });
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
