// Test-user credentials are read from env vars so nothing is hardcoded or
// committed. A disposable test account exists; put its credentials in .env
// (see .env.example). Open item: confirm whether the app has a test-mode flag
// to skip email verification for fully deterministic automated signup.

export interface TestUser {
  email: string;
  password: string;
}

export function hasTestUser(): boolean {
  return Boolean(process.env.VAULTCV_TEST_EMAIL && process.env.VAULTCV_TEST_PASSWORD);
}

export function getTestUser(): TestUser {
  const email = process.env.VAULTCV_TEST_EMAIL;
  const password = process.env.VAULTCV_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "VAULTCV_TEST_EMAIL / VAULTCV_TEST_PASSWORD not set — copy .env.example to .env and fill them in."
    );
  }
  return { email, password };
}
