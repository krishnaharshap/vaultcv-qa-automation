import { test, expect } from "../fixtures/auth";

// Mechanical flow only: upload -> enrichment completes without error. Whether
// the enrichment CONTENT is good/grounded is an eval-harness concern
// (resume-bullets.golden.jsonl in vaultcv-eval-harness-design).
//
// Selectors/routes are placeholders (authenticated DOM not yet inspected).

test.describe("Resume upload & enrichment", () => {
  test("upload a resume and trigger enrichment", async ({ authenticatedPage: page }) => {
    test.skip(true, "authenticated selectors unconfirmed — needs a logged-in DOM pass + sample file");
    await page.goto("/resume"); // TODO: confirm real route
    await page.setInputFiles('[data-testid="resume-upload"]', "fixtures/sample-resume.pdf"); // TODO placeholder
    await page.click('[data-testid="enrich-button"]'); // TODO placeholder
    await expect(page.locator('[data-testid="enrichment-status"]')).toHaveText(/complete/i, {
      timeout: 30000, // AI enrichment may be slow — TODO confirm real SLA
    });
  });

  test("enrichment failure surfaces a clear error, not a silent hang", async ({ authenticatedPage: page }) => {
    test.skip(true, "needs a reliable way to trigger an enrichment failure for testing");
  });
});
