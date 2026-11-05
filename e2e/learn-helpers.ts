import { expect, type Page } from "@playwright/test";

export const CORRECT_ANSWERS = [
  "Son iguales y van en sentidos opuestos",
  "Se duplica: ×2",
  "Se queda en un cuarto: ×¼",
  /avance tan rápido de lado/,
];

export async function predict(page: Page, answer: string | RegExp) {
  await page.getByRole("radio", { name: answer }).check();
  await page.getByRole("button", { name: "Comprobar mi predicción" }).click();
}

/** Recorre un paso completo: predecir, ver el resultado y empezar a explorar. */
export async function completeStep(page: Page, answer: string | RegExp) {
  await predict(page, answer);
  await page.getByRole("button", { name: "Probarlo yo" }).click();
}

export async function reachLaunchStep(page: Page) {
  await page.goto("/aprende");
  for (const answer of CORRECT_ANSWERS.slice(0, 3)) {
    await completeStep(page, answer);
    await page.getByRole("button", { name: "Paso siguiente" }).click();
  }
  await expect(
    page.getByRole("heading", { level: 2, name: "Caer sin llegar" }),
  ).toBeVisible();
}

/** Recorre los cuatro pasos con las respuestas correctas hasta el cierre. */
export async function reachClosing(page: Page) {
  await page.goto("/aprende");
  for (const answer of CORRECT_ANSWERS.slice(0, 3)) {
    await completeStep(page, answer);
    await page.getByRole("button", { name: "Paso siguiente" }).click();
  }
  await completeStep(page, CORRECT_ANSWERS[3]);
  await page.getByRole("button", { name: "Ver lo que has demostrado" }).click();
  await expect(page.getByText(/Has acertado 4 de 4/)).toBeVisible();
}

export async function openTutor(page: Page) {
  await page.getByRole("tab", { name: "Tutor" }).click();
}

export async function openStepTab(page: Page) {
  await page.getByRole("tab", { name: "Paso" }).click();
}
