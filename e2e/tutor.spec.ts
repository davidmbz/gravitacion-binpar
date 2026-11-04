import { expect, test } from "@playwright/test";

async function answerFirstPrediction(page: import("@playwright/test").Page) {
  await page.goto("/aprende");
  await page
    .getByRole("radio", { name: "Son iguales y van en sentidos opuestos" })
    .check();
  await page.getByRole("button", { name: "Comprobar mi predicción" }).click();
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
  await answerFirstPrediction(page);

  await page.getByLabel("Tu pregunta").fill("¿Y si los separo?");
  await page.getByRole("button", { name: "Enviar pregunta" }).click();

  await expect(page.getByRole("log")).toContainText(
    "Mira qué pasa al alejarlos.",
  );
  await expect(page.getByRole("slider", { name: "Distancia" })).toHaveValue(
    "8",
  );
  await expect(page.getByLabel("Tu pregunta")).toHaveValue("");
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
  await answerFirstPrediction(page);

  await page.getByLabel("Tu pregunta").fill("¿Por qué?");
  await page.getByRole("button", { name: "Enviar pregunta" }).click();

  await expect(page.getByRole("alert").first()).toContainText(
    "El tutor no está disponible ahora.",
  );
  await expect(page.getByLabel("Tu pregunta")).toHaveValue("¿Por qué?");

  const slider = page.getByRole("slider", { name: "Distancia" });
  await slider.fill("8");
  await expect(page.getByText("×¼").first()).toBeVisible();
});

test("una pregunta sugerida se envía con un toque", async ({ page }) => {
  await page.route("/api/tutor", (route) =>
    route.fulfill({
      json: {
        status: "ok",
        reply: "Porque el efecto depende de la masa.",
        scene: null,
      },
    }),
  );
  await answerFirstPrediction(page);

  await page.getByRole("button", { name: /por qué cae la manzana/ }).click();

  await expect(page.getByRole("log")).toContainText("por qué cae la manzana");
  await expect(page.getByRole("log")).toContainText(
    "Porque el efecto depende de la masa.",
  );
});

test("el perfil refleja la respuesta y viaja al tutor como identificadores", async ({
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
  ).toBeHidden();

  await page.getByRole("radio", { name: /A atrae a B con más fuerza/ }).check();
  await page.getByRole("button", { name: "Comprobar mi predicción" }).click();

  await expect(
    page.getByRole("heading", { name: "Lo que has demostrado" }),
  ).toBeVisible();
  await expect(page.getByText("Por reforzar")).toBeVisible();
  await expect(
    page.getByText("Creer que el cuerpo de más masa tira más fuerte"),
  ).toBeVisible();

  // Tras fallar, la primera sugerencia apunta a esa respuesta.
  await page.getByRole("button", { name: /¿Por qué no es correcto/ }).click();
  await expect(page.getByRole("log")).toContainText("Vamos a verlo.");

  expect(sentBody).toMatchObject({
    answers: { attraction: "stronger-on-b", mass: null, distance: null },
  });
  expect(sentBody).not.toHaveProperty("profile");
});
