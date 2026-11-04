import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  CORRECT_ANSWERS,
  completeStep,
  openTutor,
  predict,
} from "./learn-helpers";

test("cada fase muestra solo lo suyo", async ({ page }) => {
  await page.goto("/aprende");

  await expect(page.getByRole("radio")).toHaveCount(3);
  await expect(page.getByRole("slider")).toHaveCount(0);

  await predict(page, CORRECT_ANSWERS[0]);
  await expect(page.getByText("Has acertado")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("slider")).toHaveCount(0);

  await page.getByRole("button", { name: "Probarlo yo" }).click();
  await expect(page.getByRole("slider")).toHaveCount(3);
  await expect(page.getByText("Has acertado")).toHaveCount(0);
});

test("el resultado de la masa se ve en la mesa antes de tocar nada", async ({
  page,
}) => {
  await page.goto("/aprende");
  await completeStep(page, CORRECT_ANSWERS[0]);
  await page.getByRole("button", { name: "Paso siguiente" }).click();

  await predict(page, CORRECT_ANSWERS[1]);

  await expect(page.getByRole("img", { name: /masa 8/ })).toBeVisible();
  await expect(page.getByText("×2", { exact: true })).toBeVisible();
});

test("el foco acompaña al cambio de fase", async ({ page }) => {
  await page.goto("/aprende");
  await predict(page, CORRECT_ANSWERS[0]);
  await expect(
    page.getByRole("heading", { level: 2, name: "Atracción mutua" }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Probarlo yo" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Compruébalo tú" }),
  ).toBeFocused();
});

test("las pestañas se manejan con flechas y una sola parada de tabulador", async ({
  page,
}) => {
  await page.goto("/aprende");
  const stepTab = page.getByRole("tab", { name: "Paso" });
  const tutorTab = page.getByRole("tab", { name: "Tutor" });

  await stepTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(tutorTab).toBeFocused();
  await expect(tutorTab).toHaveAttribute("aria-selected", "true");
  await expect(stepTab).toHaveAttribute("tabindex", "-1");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);

  await page.keyboard.press("ArrowRight");
  await expect(stepTab).toBeFocused();
});

test("tras fallar se puede preguntar al tutor sin perder el foco", async ({
  page,
}) => {
  await page.goto("/aprende");
  await predict(page, /A atrae a B con más fuerza/);

  await page
    .getByRole("button", { name: "Preguntar al tutor por qué" })
    .click();

  const tab = page.getByRole("tab", { name: "Tutor" });
  await expect(tab).toBeFocused();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("button", { name: /¿Por qué no es correcto/ }),
  ).toBeVisible();
});

test("tras acertar no se ofrece el atajo al tutor", async ({ page }) => {
  await page.goto("/aprende");
  await predict(page, CORRECT_ANSWERS[0]);
  await expect(
    page.getByRole("button", { name: "Preguntar al tutor por qué" }),
  ).toHaveCount(0);
});

test("ninguna fase tiene violaciones de accesibilidad", async ({ page }) => {
  const expectClean = async () => {
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  };

  await page.goto("/aprende");
  await predict(page, CORRECT_ANSWERS[0]);
  await expectClean();

  await page.getByRole("button", { name: "Probarlo yo" }).click();
  await expectClean();

  await openTutor(page);
  await expectClean();
});

async function openExploration(page: Page) {
  await page.goto("/aprende");
  await completeStep(page, CORRECT_ANSWERS[0]);
}

test.describe("en móvil", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("la mesa y la acción siguiente quedan siempre a la vista", async ({
    page,
  }) => {
    await page.goto("/aprende");
    const table = page.getByRole("img", { name: /Cuerpo A/ });
    const action = page.getByRole("button", {
      name: "Comprobar mi predicción",
    });
    await expect(table).toBeInViewport({ ratio: 1 });
    await expect(action).toBeInViewport({ ratio: 1 });

    await predict(page, CORRECT_ANSWERS[0]);
    await expect(page.getByText("Has acertado")).toBeInViewport();
    await expect(table).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "Probarlo yo" }),
    ).toBeInViewport({ ratio: 1 });
  });

  test("se ve al menos una opción sin hacer scroll", async ({ page }) => {
    await page.goto("/aprende");
    await expect(page.getByRole("radio").first()).toBeInViewport({ ratio: 1 });
  });

  test("los objetivos táctiles miden al menos 44 px", async ({ page }) => {
    await openExploration(page);
    for (const target of [
      page.getByRole("tab", { name: "Tutor" }),
      page.getByRole("button", { name: "Paso siguiente" }),
      page.getByRole("button", { name: "Atrás" }),
      page.getByRole("slider", { name: "Distancia" }),
    ]) {
      const box = await target.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("con el teclado abierto, el campo del tutor sigue a la vista", async ({
    page,
  }) => {
    await page.goto("/aprende");
    await openTutor(page);
    const field = page.getByLabel("Tu pregunta");
    await field.focus();

    // Un teclado de móvil deja unos 340 px de alto útil.
    await page.setViewportSize({ width: 375, height: 340 });

    await expect(field).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "Enviar", exact: true }),
    ).toBeInViewport({ ratio: 1 });
  });
});
