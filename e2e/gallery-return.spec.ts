import { expect, test, type Page } from "@playwright/test";

const FILTERED_URL = /\/orbitas\?curva=propia$/;

async function openFromFilteredGallery(page: Page) {
  await page.goto("/orbitas");
  await page.getByRole("radio", { name: "Una curva por cuerpo" }).check();
  await expect(page).toHaveURL(FILTERED_URL);
  await expect(page.getByRole("status")).toHaveText("4 de 6 órbitas");

  const card = page.getByRole("link", { name: /Yin-Yang I/ });
  await card.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore).toBeGreaterThan(0);

  await card.click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Yin-Yang I" }),
  ).toBeVisible();
  return scrollBefore;
}

async function expectRestoredState(page: Page, scrollBefore: number) {
  await expect(page).toHaveURL(FILTERED_URL);
  await expect(
    page.getByRole("radio", { name: "Una curva por cuerpo" }),
  ).toBeChecked();
  await expect(page.getByRole("status")).toHaveText("4 de 6 órbitas");
  await expect(page.getByRole("link", { name: /Yin-Yang I/ })).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(scrollBefore, 0);
}

test.describe("volver del detalle a la galería", () => {
  test.use({ viewport: { width: 390, height: 640 } });

  test("con el enlace Volver a la galería", async ({ page }) => {
    const scrollBefore = await openFromFilteredGallery(page);
    await page.getByRole("link", { name: "Volver a la galería" }).click();
    await expectRestoredState(page, scrollBefore);
  });

  test("con el enlace Órbitas de la cabecera", async ({ page }) => {
    const scrollBefore = await openFromFilteredGallery(page);
    await page
      .getByRole("navigation", { name: "Principal" })
      .getByRole("link", { name: "Órbitas" })
      .click();
    await expectRestoredState(page, scrollBefore);
  });

  test("con el botón atrás del navegador", async ({ page }) => {
    const scrollBefore = await openFromFilteredGallery(page);
    await page.goBack();
    await expectRestoredState(page, scrollBefore);
  });

  test("entrando por URL directa navega a la galería", async ({ page }) => {
    await page.goto("/orbitas/goggles");
    await page.getByRole("link", { name: "Volver a la galería" }).click();
    await expect(page).toHaveURL(/\/orbitas$/);
    await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");
  });
});

// Con streaming el estado HTTP ya es 200 cuando corre notFound(): Next lo
// documenta como soft 404 y añade noindex.
test("una órbita desconocida muestra la página de no encontrado", async ({
  page,
}) => {
  await page.goto("/orbitas/no-existe");
  await expect(
    page.getByRole("heading", { level: 1, name: "Esta página no existe" }),
  ).toBeVisible();
  // Next puede inyectar la etiqueta dos veces mientras transmite la respuesta.
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    "noindex",
  );
});
