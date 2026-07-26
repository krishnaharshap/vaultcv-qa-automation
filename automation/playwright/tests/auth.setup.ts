import { test as setup } from "@playwright/test";
import { getTestUser, hasTestUser } from "../utils/test-users";

// Logs in once and saves the authenticated storageState for the browser
// projects to reuse. Selectors below were confirmed against app.vaultcv.com
// live DOM on 2026-07-26.
const STORAGE_STATE = ".auth/user.json";

setup("authenticate", async ({ page }) => {
  setup.skip(!hasTestUser(), "VAULTCV_TEST_EMAIL/PASSWORD not set — see .env.example.");

  const user = getTestUser();

  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // TODO: confirm the real authenticated landing route. Login lives at /login;
  // on success the app should redirect away from it. Tighten this to the exact
  // route (e.g. /dashboard or /vault) once verified with the test account.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });

  await page.context().storageState({ path: STORAGE_STATE });
});
