import { test, expect } from "@playwright/test";
import { checkCloudflareHealth } from "../fixtures/cloudflare-health";

// Runs as its own "health" project and gates the rest of the suite (see
// playwright.config.ts dependencies). If this fails, setup + feature specs are
// skipped, so a Cloudflare tunnel outage reads as one clear failure rather
// than a wave of unrelated broken tests.
test("Cloudflare edge/tunnel health gate", async () => {
  const baseUrl = process.env.VAULTCV_BASE_URL ?? "https://app.vaultcv.com";
  const result = await checkCloudflareHealth(baseUrl);
  expect(
    result.healthy,
    `Site unreachable at edge: ${result.detail}. Downstream failures in this run are likely infra-caused, not real regressions.`
  ).toBe(true);
});
