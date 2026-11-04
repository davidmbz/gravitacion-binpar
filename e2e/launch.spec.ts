import { expect, test, type Page } from "@playwright/test";
import {
  CORRECT_ANSWERS,
  completeStep,
  openTutor,
  reachLaunchStep,
} from "./learn-helpers";

const LAST_ANSWER = CORRECT_ANSWERS[3];

const stageNote = (page: Page) =>
  page.getByRole("status", { name: "Resultado del lanzamiento" });

async function launch(page: Page, speed: string, angle = "0") {
  await page.getByRole("slider", { name: "Velocidad" }).fill(speed);
  await page
    .getByRole("slider", { name: "Ángulo sobre la horizontal" })
    .fill(angle);
  await page.getByRole("button", { name: "Lanzar la luna" }).click();
}

test("los controles no existen antes de responder", async ({ page }) => {
  await reachLaunchStep(page);
  await expect(
    page.getByRole("button", { name: "Lanzar la luna" }),
  ).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Velocidad" })).toHaveCount(0);
});

test("el resultado enseña un lanzamiento de ejemplo en la mesa", async ({
  page,
}) => {
  await reachLaunchStep(page);
  await page.getByRole("radio", { name: LAST_ANSWER }).check();
  await page.getByRole("button", { name: "Comprobar mi predicción" }).click();

  await expect(stageNote(page)).toContainText("En vuelo.");
  await expect(stageNote(page)).toContainText("Da una vuelta cada 6,3", {
    timeout: 12_000,
  });
});

test("la luna vuela y al terminar muestra el resultado", async ({ page }) => {
  await reachLaunchStep(page);
  await completeStep(page, LAST_ANSWER);
  await launch(page, "0.7");

  await expect(stageNote(page)).toContainText("En vuelo.");
  await expect(stageNote(page)).toContainText("Choque", { timeout: 10_000 });
});

test.describe("con prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("muestra órbita, choque y escape sin animar", async ({ page }) => {
    await reachLaunchStep(page);
    await completeStep(page, LAST_ANSWER);

    await launch(page, "0.7");
    await expect(stageNote(page)).toContainText("Choque");

    await launch(page, "1");
    await expect(stageNote(page)).toContainText("Da una vuelta cada 6,3");

    await launch(page, "1.5");
    await expect(stageNote(page)).toContainText("Escape");

    await launch(page, "1.4");
    await expect(stageNote(page)).toContainText("muy abierta");
  });

  test("cambiar un control borra el resultado anterior", async ({ page }) => {
    await reachLaunchStep(page);
    await completeStep(page, LAST_ANSWER);
    await launch(page, "0.7");
    await expect(stageNote(page)).toContainText("Choque");

    await page.getByRole("slider", { name: "Velocidad" }).fill("1");

    await expect(stageNote(page)).toContainText("Elige velocidad");
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
  await completeStep(page, LAST_ANSWER);
  await page.getByRole("slider", { name: "Velocidad" }).fill("1.2");
  await openTutor(page);
  await page
    .getByRole("button", { name: "¿Por qué la Luna no se cae a la Tierra?" })
    .click();

  await expect(page.getByRole("log")).toContainText("Prueba con más velocidad");
  expect(sentBody).toMatchObject({
    stepId: "orbit",
    launch: { speed: 1.2, angle: 0 },
  });
});
