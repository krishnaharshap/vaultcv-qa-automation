import { test, expect } from "@playwright/test";

// The auth spec tests the login/signup flow itself, so it must run
// UNauthenticated — override the project-level storageState.
test.use({ storageState: { cookies: [], origins: [] } });

// Selectors confirmed via live DOM inspection of app.vaultcv.com on 2026-07-26:
//   email    -> input[type="email"], placeholder "you@example.com"
//   password -> input[type="password"], placeholder "••••••••"
//   submit   -> button "Sign in"
//   signup   -> link "Create one" -> /signup

test.describe("Auth", () => {
  test("login form renders its fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create one" })).toHaveAttribute("href", "/signup");
  });

  test("signup form renders its fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Min. 8 characters")).toBeVisible();
    await expect(page.getByPlaceholder("Repeat password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("login with valid credentials leaves the login page", async ({ page }) => {
    const email = process.env.VAULTCV_TEST_EMAIL;
    const password = process.env.VAULTCV_TEST_PASSWORD;
    test.skip(!email || !password, "VAULTCV_TEST_EMAIL/PASSWORD not set — see .env.example.");

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    // TODO: confirm the real authenticated landing route; for now assert we left /login.
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("login with invalid credentials stays on /login and does not crash", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("not-a-real-user@example.com");
    await page.locator('input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should remain on the login page and surface an error rather than navigate
    // or throw. TODO: tighten to assert the real error element/copy once the
    // app's error UI is inspectable (needs a real failed-login response).
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout clears session and blocks protected routes", async () => {
    test.skip(true, "depends on confirmed logout control + protected-route redirect behavior");
  });
});
