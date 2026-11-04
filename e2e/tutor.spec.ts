import { expect, test, type Page } from "@playwright/test";
import {
  CORRECT_ANSWERS,
  completeStep,
  openStepTab,
  openTutor,
  predict,
} from "./learn-helpers";

async function reachFirstExploration(page: Page) {
  await page.goto("/aprende");
  await completeStep(page, CORRECT_ANSWERS[0]);
}

test("el tutor responde y mueve la mesa", async ({ page }) => {
  await page.route("/api/tutor", (route) =>
    route.fulfill({
      json: {
        status: "ok",
        reply: "Mira qué pasa al alejarlos.",
        scene: { massA: 4, massB: 2, distance: 8 },
      },
    }),
  );
  await reachFirstExploration(page);
  await openTutor(page);

  await page.getByLabel("Tu pregunta").fill("¿Y si los separo?");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();

  await expect(page.getByRole("log")).toContainText(
    "Mira qué pasa al alejarlos.",
  );
  await expect(page.getByLabel("Tu pregunta")).toHaveValue("");

  await openStepTab(page);
  await expect(page.getByRole("slider", { name: "Distancia" })).toHaveValue(
    "8",
  );
});

test("un error del tutor se muestra y la mesa sigue funcionando", async ({
  page,
}) => {
  await page.route("/api/tutor", (route) =>
    route.fulfill({
      status: 503,
      json: { status: "error", message: "El tutor no está disponible ahora." },
    }),
  );
  await reachFirstExploration(page);
  await openTutor(page);

  await page.getByLabel("Tu pregunta").fill("¿Por qué?");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();

  await expect(page.getByRole("alert").first()).toContainText(
    "El tutor no está disponible ahora.",
  );
  await expect(page.getByLabel("Tu pregunta")).toHaveValue("¿Por qué?");

  await openStepTab(page);
  await page.getByRole("slider", { name: "Distancia" }).fill("8");
  await expect(page.getByText("×¼").first()).toBeVisible();
});

test("la conversación y el borrador sobreviven al cambiar de pestaña", async ({
  page,
}) => {
  await page.route("/api/tutor", (route) =>
    route.fulfill({
      json: { status: "ok", reply: "Te respondo.", scene: null },
    }),
  );
  await reachFirstExploration(page);
  await openTutor(page);
  await page.getByRole("button", { name: /por qué cae la manzana/ }).click();
  await expect(page.getByRole("log")).toContainText("Te respondo.");
  await page.getByLabel("Tu pregunta").fill("Un borrador");

  await openStepTab(page);
  await openTutor(page);

  await expect(page.getByRole("log")).toContainText("Te respondo.");
  await expect(page.getByLabel("Tu pregunta")).toHaveValue("Un borrador");
});

test("el aviso de privacidad está en el tutor", async ({ page }) => {
  await page.goto("/aprende");
  await openTutor(page);
  await expect(page.getByText(/proveedor externo/)).toBeVisible();
});

test("el perfil cierra el recorrido y viaja al tutor como identificadores", async ({
  page,
}) => {
  let sentBody: unknown = null;
  await page.route("/api/tutor", (route) => {
    sentBody = route.request().postDataJSON();
    return route.fulfill({
      json: { status: "ok", reply: "Vamos a verlo.", scene: null },
    });
  });

  await page.goto("/aprende");
  await expect(
    page.getByRole("heading", { name: "Lo que has demostrado" }),
  ).toHaveCount(0);

  await predict(page, /A atrae a B con más fuerza/);

  // Tras fallar, la primera sugerencia apunta a esa respuesta.
  await openTutor(page);
  await page.getByRole("button", { name: /¿Por qué no es correcto/ }).click();
  await expect(page.getByRole("log")).toContainText("Vamos a verlo.");
  expect(sentBody).toMatchObject({
    answers: { attraction: "stronger-on-b", mass: null, distance: null },
  });
  expect(sentBody).not.toHaveProperty("profile");

  await openStepTab(page);
  await page.getByRole("button", { name: "Probarlo yo" }).click();
  await page.getByRole("button", { name: "Paso siguiente" }).click();
  for (const answer of CORRECT_ANSWERS.slice(1, 3)) {
    await completeStep(page, answer);
    await page.getByRole("button", { name: "Paso siguiente" }).click();
  }
  await completeStep(page, CORRECT_ANSWERS[3]);
  await page.getByRole("button", { name: "Ver lo que has demostrado" }).click();

  await expect(
    page.getByRole("heading", { name: "Lo que has demostrado" }),
  ).toBeVisible();
  await expect(
    page.getByText("Has acertado 3 de 4 predicciones."),
  ).toBeVisible();
  await expect(page.getByText("Por reforzar")).toBeVisible();
  await expect(
    page.getByText("Creer que el cuerpo de más masa tira más fuerte"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver las seis órbitas" }),
  ).toBeVisible();
});
