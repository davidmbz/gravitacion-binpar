import { defineConfig, devices } from "@playwright/test";

// El e2e corre contra el build de producción: Activity y el prefetch se
// comportan distinto en desarrollo.
const productionUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: productionUrl ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: productionUrl
    ? undefined
    : {
        command: "pnpm build && pnpm start --port 3100",
        url: "http://localhost:3100",
        timeout: 180_000,
        reuseExistingServer: true,
      },
});
