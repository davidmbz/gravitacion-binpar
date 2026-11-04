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
