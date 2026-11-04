import { expect, test, type Page } from "@playwright/test";

const CORRECT_ANSWERS = [
  "Son iguales y van en sentidos opuestos",
  "Se duplica: ×2",
  "Se queda en un cuarto: ×¼",
];

async function reachLaunchStep(page: Page) {
  await page.goto("/aprende");
  for (const answer of CORRECT_ANSWERS) {
    await page.getByRole("radio", { name: answer }).check();
    await page.getByRole("button", { name: "Comprobar mi predicción" }).click();
    await page.getByRole("button", { name: "Paso siguiente" }).click();
  }
  await expect(
    page.getByRole("heading", { level: 2, name: "Caer sin llegar" }),
  ).toBeVisible();
}

async function answerLaunchPrediction(page: Page) {
  await page.getByRole("radio", { name: /avance tan rápido de lado/ }).check();
  await page.getByRole("button", { name: "Comprobar mi predicción" }).click();
}

async function launch(page: Page, speed: string, angle = "0") {
  await page.getByRole("slider", { name: "Velocidad" }).fill(speed);
  await page
    .getByRole("slider", { name: "Ángulo sobre la horizontal" })
    .fill(angle);
  await page.getByRole("button", { name: "Lanzar la luna" }).click();
}

test("no se puede lanzar antes de responder", async ({ page }) => {
  await reachLaunchStep(page);
  await expect(
    page.getByRole("button", { name: "Lanzar la luna" }),
  ).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Velocidad" })).toBeDisabled();
});

test("la luna vuela y al terminar muestra el resultado", async ({ page }) => {
  await reachLaunchStep(page);
  await answerLaunchPrediction(page);
  await launch(page, "0.7");

  await expect(page.getByText("En vuelo.")).toBeVisible();
  await expect(page.locator("figcaption")).toContainText("Choque", {
    timeout: 10_000,
  });
});

test.describe("con prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("muestra órbita, choque y escape sin animar", async ({ page }) => {
    await reachLaunchStep(page);
    await answerLaunchPrediction(page);
    const caption = page.locator("figcaption");

    await launch(page, "0.7");
    await expect(caption).toContainText("Choque");

    await launch(page, "1");
    await expect(caption).toContainText("Da una vuelta cada 6,3");

    await launch(page, "1.5");
    await expect(caption).toContainText("Escape");

    await launch(page, "1.4");
    await expect(caption).toContainText("muy abierta");
  });

  test("cambiar un control borra el resultado anterior", async ({ page }) => {
    await reachLaunchStep(page);
    await answerLaunchPrediction(page);
    await launch(page, "0.7");
    await expect(page.locator("figcaption")).toContainText("Choque");

    await page.getByRole("slider", { name: "Velocidad" }).fill("1");

    await expect(page.locator("figcaption")).toContainText("Elige velocidad");
  });
});

test("el tutor recibe el lanzamiento preparado", async ({ page }) => {
  let sentBody: unknown = null;
  await page.route("/api/tutor", (route) => {
    sentBody = route.request().postDataJSON();
    return route.fulfill({
      json: { status: "ok", reply: "Prueba con más velocidad.", scene: null },
    });
  });

  await reachLaunchStep(page);
  await answerLaunchPrediction(page);
  await page.getByRole("slider", { name: "Velocidad" }).fill("1.2");
  await page
    .getByRole("button", { name: "¿Por qué la Luna no se cae a la Tierra?" })
    .click();

  await expect(page.getByRole("log")).toContainText("Prueba con más velocidad");
  expect(sentBody).toMatchObject({
    stepId: "orbit",
    launch: { speed: 1.2, angle: 0 },
  });
});
