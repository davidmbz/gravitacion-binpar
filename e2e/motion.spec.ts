import { expect, test, type Locator, type Page } from "@playwright/test";

/** Cuenta los píxeles pintados: un canvas transparente da 0. */
function paintedPixels(canvas: Locator) {
  return canvas.evaluate((node: HTMLCanvasElement) => {
    const context = node.getContext("2d");
    if (!context || node.width === 0) return 0;
    const { data } = context.getImageData(0, 0, node.width, node.height);
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count += 1;
    return count;
  });
}

const cardCanvas = (page: Page, name: RegExp) =>
  page.getByRole("link", { name }).locator("canvas");

/** El contador solo existe cuando la galería real ha sustituido a la de reserva. */
async function openGallery(page: Page) {
  await page.goto("/orbitas");
  await expect(page.getByRole("status")).toHaveText("6 de 6 órbitas");
}

test("la tarjeta se anima al pasar el ratón y se detiene al salir", async ({
  page,
}) => {
  await openGallery(page);
  const link = page.getByRole("link", { name: /Goggles/ });
  await link.scrollIntoViewIfNeeded();
  await link.hover();

  const canvas = cardCanvas(page, /Goggles/);
  await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);

  await page.mouse.move(0, 0);
  await expect.poll(() => paintedPixels(canvas)).toBe(0);
});

test("solo se anima una tarjeta a la vez", async ({ page }) => {
  await openGallery(page);
  await page.getByRole("link", { name: /Lagrange/ }).hover();
  const first = cardCanvas(page, /Lagrange/);
  await expect.poll(() => paintedPixels(first)).toBeGreaterThan(0);

  await page.getByRole("link", { name: /Figura de ocho/ }).hover();
  await expect.poll(() => paintedPixels(first)).toBe(0);
  await expect
    .poll(() => paintedPixels(cardCanvas(page, /Figura de ocho/)))
    .toBeGreaterThan(0);
});

test("la tarjeta se anima al enfocarla con el teclado", async ({ page }) => {
  await openGallery(page);
  await page.getByRole("radio", { name: "Todas" }).focus();
  await page.keyboard.press("Tab");

  await expect(page.getByRole("link", { name: /Lagrange/ })).toBeFocused();
  await expect
    .poll(() => paintedPixels(cardCanvas(page, /Lagrange/)))
    .toBeGreaterThan(0);
});

test.describe("con prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("la tarjeta no se anima", async ({ page }) => {
    await openGallery(page);
    await page.getByRole("link", { name: /Lagrange/ }).hover();
    await page.waitForTimeout(300);
    expect(await paintedPixels(cardCanvas(page, /Lagrange/))).toBe(0);
  });

  test("el detalle arranca en pausa y se puede reproducir", async ({
    page,
  }) => {
    await page.goto("/orbitas/lagrange");
    await page.getByRole("button", { name: "Reproducir" }).click();
    await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  });

  test("la portada queda quieta, con los cuerpos dibujados", async ({
    page,
  }) => {
    await page.goto("/");
    const canvas = page.locator("canvas");
    await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
    const first = await paintedPixels(canvas);
    await page.waitForTimeout(300);
    expect(await paintedPixels(canvas)).toBe(first);
  });
});

test("los controles del detalle caben en pantalla en escritorio", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const slug of ["butterfly-i", "yin-yang-i", "lagrange"]) {
    await page.goto(`/orbitas/${slug}`);
    await expect(
      page.getByRole("slider", { name: "Momento del periodo" }),
    ).toBeInViewport({ ratio: 1 });
  }
});
