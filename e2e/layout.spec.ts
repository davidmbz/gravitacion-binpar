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
