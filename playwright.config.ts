import { defineConfig, devices } from "@playwright/test";

// El e2e corre contra el build de producción: Activity y el prefetch se
// comportan distinto en desarrollo.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start --port 3100",
    url: "http://localhost:3100",
    timeout: 180_000,
    reuseExistingServer: true,
  },
});
