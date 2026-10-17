import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 4173);
const configuredBaseURL = process.env.E2E_BASE_URL?.trim();
const baseURL = configuredBaseURL || `http://localhost:${PORT}`;

// Quarantine: tag a consistently failing test with "@quarantine" in its title
// (e.g. test("does X @quarantine", ...)). Quarantined tests are excluded from
// normal runs and executed separately (non-blocking) when E2E_QUARANTINE=only.
const quarantineMode = process.env.E2E_QUARANTINE ?? "exclude"; // exclude | only | include
const QUARANTINE = /@quarantine/;

const retries = process.env.E2E_RETRIES
  ? Number(process.env.E2E_RETRIES)
  : process.env.CI
    ? 2
    : 0;

const chromiumLaunch = process.env.E2E_CHROMIUM_PATH
  ? { executablePath: process.env.E2E_CHROMIUM_PATH }
  : {};

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Flaky tests get retried; a test that passes on retry is reported "flaky".
  retries,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : process.env.CI ? 2 : undefined,
  grep: quarantineMode === "only" ? QUARANTINE : undefined,
  grepInvert: quarantineMode === "exclude" ? QUARANTINE : undefined,
  outputDir: "test-results",
  reporter: process.env.CI
    ? [
        ["github"],
        ["list"],
        ["blob", { outputDir: "blob-report" }],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["junit", { outputFile: "playwright-report/junit.xml" }],
        ["json", { outputFile: "playwright-report/results.json" }],
      ]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: chromiumLaunch } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  webServer: configuredBaseURL
    ? undefined
    : {
        command: `bun run dev --port ${PORT} --host 127.0.0.1`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
