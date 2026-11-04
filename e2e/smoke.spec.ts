import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/aprende", "/orbitas", "/orbitas/figura-de-ocho"]) {
  test(`${path} no tiene violaciones de accesibilidad`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}

// axe marca un contraste 1:1 como incompleto, no como violación: esto lo cubre.
test("la acción principal de la portada tiene texto legible", async ({
  page,
}) => {
  await page.goto("/");
  const action = page.getByRole("link", { name: "Aprender la ley" });
  await expect(action).toHaveCSS("color", "rgb(238, 240, 232)");
  await expect(action).toHaveCSS("background-color", "rgb(31, 78, 121)");
});

test("cada órbita publica su imagen para compartir", async ({
  page,
  request,
}) => {
  await page.goto("/orbitas/butterfly-i");
  const url = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(url).toContain("/orbitas/butterfly-i/opengraph-image");

  // La URL es absoluta y su dominio depende del entorno: se comprueba la ruta.
  const { pathname, search } = new URL(url ?? "");
  const response = await request.get(`${pathname}${search}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});
