import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Loads VAULTCV_BASE_URL / VAULTCV_TEST_EMAIL / VAULTCV_TEST_PASSWORD from a
// local .env (gitignored). See .env.example.
dotenv.config();

// storageState written by tests/auth.setup.ts and reused by the browser
// projects so feature specs don't re-login. Gitignored (see .gitignore).
const STORAGE_STATE = ".auth/user.json";

const BASE_URL = process.env.VAULTCV_BASE_URL ?? "https://app.vaultcv.com";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // 1. Cloudflare edge/tunnel health gate. Runs first; everything else
    //    depends on it, so the known 1033/530 outage is reported as ONE
    //    distinct failure instead of a wave of misleading test failures.
    {
      name: "health",
      testMatch: /cloudflare-health\.spec\.ts/,
    },

    // 2. Auth setup. Logs in once with the test account and saves storageState.
    //    Skipped automatically if no credentials are set (see utils/test-users).
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      dependencies: ["health"],
    },

    // 3. Functional suites, authenticated via the saved storageState.
    //    auth.spec.ts overrides storageState to run unauthenticated (it tests
    //    the login flow itself).
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
      testIgnore: [/cloudflare-health\.spec\.ts/, /auth\.setup\.ts/],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
      testIgnore: [/cloudflare-health\.spec\.ts/, /auth\.setup\.ts/],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
      testIgnore: [/cloudflare-health\.spec\.ts/, /auth\.setup\.ts/],
    },
  ],
});
