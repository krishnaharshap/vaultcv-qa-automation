# VaultCV E2E (Playwright)

Functional/E2E coverage for `app.vaultcv.com`: auth, Story Wall, resume enrichment, job matching, dashboard. TypeScript, for consistency with the Next.js/TS app.

Status: scaffold. Auth (login/signup) specs use **real selectors** confirmed against the live DOM on 2026-07-26. Feature specs (Story Wall, resume, job) use **placeholder selectors** and are `test.skip`ed until an authenticated DOM pass replaces them.

## Setup

```
cd automation/playwright
npm install
npm run install:browsers
cp .env.example .env      # then fill in VAULTCV_TEST_EMAIL / VAULTCV_TEST_PASSWORD
```

## Running

```
npm test                  # full suite: health gate -> auth setup -> feature specs
npm run test:health       # just the Cloudflare edge/tunnel gate
npm run test:ui           # Playwright UI mode
npm run report            # open the last HTML report
npm run typecheck         # tsc --noEmit
```

## How it's wired

- **Health gate first.** The `health` project (`tests/cloudflare-health.spec.ts`) runs before everything; `setup` and the browser projects depend on it. If the Cloudflare tunnel is down (known 1033/530 issue), it fails once and the rest is skipped instead of producing a wave of misleading failures.
- **Auth via storageState.** `tests/auth.setup.ts` logs in once and saves `.auth/user.json`; browser projects reuse it, so feature specs don't re-login. Setup auto-skips if no credentials are set.
- **auth.spec.ts runs unauthenticated** (it tests the login/signup flow itself) by overriding storageState.

## Open items (before feature specs run green)

- [ ] Authenticated-DOM selector pass for Story Wall, resume enrichment, job add/match (routes + `data-testid`s are placeholders).
- [ ] Confirm the real post-login landing route (currently asserts "left /login").
- [ ] Confirm the login error element/copy for the invalid-credentials case.
- [ ] Sample resume file for the enrichment upload test.
- [ ] A known JS-rendered job-posting URL for the scraping regression flag.
- [ ] Whether a test-mode flag exists to skip email verification for signup automation.
- [ ] Add `@axe-core/playwright` accessibility scans once flows are real (dep already declared).

## Design reference

`research/08_autonomous_test_automation_design.md` (section 6), the test plan in `test-plans/`, and the Cloudflare 1033/530 RCA in `knowledge-base/03_chat_cloudflare_error_1033_analysis.md`.
