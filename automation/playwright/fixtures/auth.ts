import { test as base, type Page } from "@playwright/test";

// Feature specs run authenticated via storageState applied at the project
// level (see playwright.config.ts + tests/auth.setup.ts). This fixture simply
// exposes the already-authenticated page as `authenticatedPage`, so feature
// specs read clearly and none of them re-implement the login flow.
//
// If auth.setup.ts was skipped (no credentials), the storageState file is
// empty/absent and these specs will land on the login page — the individual
// specs guard with test.skip where that matters.
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },
});

export { expect } from "@playwright/test";
