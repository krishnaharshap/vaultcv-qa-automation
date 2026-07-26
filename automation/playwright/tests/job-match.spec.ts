import { test, expect } from "../fixtures/auth";

// Mechanical flow only. Match quality/relevance -> eval harness
// (job-match.golden.jsonl). Two known issues from ground-truth.md are exercised
// here and should be treated as regression flags:
//   - job-scraping against JS-rendered pages (known failure)
//   - UI corruption in the job-description field
//
// Selectors/routes are placeholders (authenticated DOM not yet inspected).

test.describe("Job add & match", () => {
  test("add a job by pasting a job description", async ({ authenticatedPage: page }) => {
    test.skip(true, "authenticated selectors unconfirmed — needs a logged-in DOM pass");
    await page.goto("/jobs"); // TODO: confirm real route
    await page.click('[data-testid="add-job"]'); // TODO placeholder
    // NOTE: this is the field with known UI corruption — watch for it here.
    await page.fill('[data-testid="job-description-input"]', "Sample JD text"); // TODO placeholder
    await page.click('[data-testid="save-job"]'); // TODO placeholder
    await expect(page.locator("text=Sample JD text")).toBeVisible();
  });

  test("add a job by URL (scraping) — known failure for JS-rendered pages", async ({ authenticatedPage: page }) => {
    test.skip(true, "authenticated selectors unconfirmed; keep as regression flag once wired");
    await page.goto("/jobs");
    await page.click('[data-testid="add-job-by-url"]'); // TODO placeholder
    await page.fill('[data-testid="job-url-input"]', "<TODO: a known JS-rendered job posting URL>");
    await page.click('[data-testid="scrape-button"]'); // TODO placeholder
    // Expected to fail until the scraping fix lands — keep as a regression flag.
    await expect(page.locator('[data-testid="job-title"]')).not.toBeEmpty();
  });

  test("job-match score reflects an obvious relevance signal", async ({ authenticatedPage: page }) => {
    test.skip(true, "match-score UI/selector not yet confirmed");
  });
});
