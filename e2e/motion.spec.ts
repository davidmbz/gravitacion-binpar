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

  test("la comparación queda en pausa, con barra y lectura al inicio", async ({
    page,
  }) => {
    await page.goto("/orbitas/lagrange");
    const slider = page.getByRole("slider", { name: "Momento del periodo" });
    await slider.fill("500");

    await page.getByRole("button", { name: "Perturbar", exact: true }).click();

    await expect(
      page.getByRole("button", { name: "Reproducir" }),
    ).toBeVisible();
    await expect(
      page.getByRole("slider", { name: "Momento de la simulación" }),
    ).toHaveValue("0");
    await expect(page.getByText("Instante 0.")).toBeVisible();
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

test.describe("perturbar una órbita", () => {
  test("Lagrange se separa y se puede volver a la órbita original", async ({
    page,
  }) => {
    await page.goto("/orbitas/lagrange");
    const figure = page.getByRole("img", { name: /Trayectoria de los tres/ });
    const originalBox = await figure.getAttribute("viewBox");

    await page.getByRole("button", { name: "Perturbar", exact: true }).click();

    const status = page.getByRole("status");
    await expect(status).toContainText("100 veces mayor");
    await expect(
      page.getByRole("slider", { name: "Momento de la simulación" }),
    ).toBeVisible();
    // Los cuerpos se salen del encuadre original: el marco se amplía.
    expect(await figure.getAttribute("viewBox")).not.toBe(originalBox);

    await page.getByRole("button", { name: "Sin perturbar" }).click();
    await expect(
      page.getByRole("slider", { name: "Momento del periodo" }),
    ).toBeVisible();
    expect(await figure.getAttribute("viewBox")).toBe(originalBox);
  });

  test("Moth I no exagera un resultado que no se ve", async ({ page }) => {
    await page.goto("/orbitas/moth-i");
    await page.getByRole("button", { name: "Perturbar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("no pasó de");
  });

  test("la barra llega al final, se detiene y se puede repetir", async ({
    page,
  }) => {
    await page.goto("/orbitas/figura-de-ocho");
    await page.getByRole("button", { name: "Perturbar", exact: true }).click();
    const slider = page.getByRole("slider", {
      name: "Momento de la simulación",
    });
    await slider.fill("1000");
    await expect(page.getByRole("button", { name: "Reproducir" })).toBeVisible({
      timeout: 2000,
    });
    await page.getByRole("button", { name: "Reproducir" }).click();
    await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
    await expect.poll(() => slider.inputValue()).not.toBe("1000");
  });

  test("los controles caben en escritorio durante la comparación", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/orbitas/yin-yang-i");
    await page.getByRole("button", { name: "Perturbar", exact: true }).click();
    await expect(
      page.getByRole("slider", { name: "Momento de la simulación" }),
    ).toBeInViewport({ ratio: 1 });
  });
});
