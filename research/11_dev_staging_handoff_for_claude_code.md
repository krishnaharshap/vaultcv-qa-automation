# Dev Staging Handoff: Implementation Instructions

Date: 2026-08-20
Audience: a coding agent (Claude Code) implementing changes to `automation/playwright/`.
Purpose: turn the 35 test cases in `test-plans/staging-e2e-test-plan-20260820.md` into working automation against `dev.vaultcv.com`, and correct the framework's remaining gaps against the design references (`engineering:testing-strategy`, `vaultcv-qa`, `vaultcv-e2e-design`).

Read `test-plans/staging-e2e-test-plan-20260820.md` and `research/10_phase2_e2e_implementation_plan.md` before starting. This document is the "how to build it," those are the "what and why."

---

## Context you need before touching code

- **Environment shift.** Testing now targets `https://dev.vaultcv.com` (staging), not `https://app.vaultcv.com` (production). The existing scaffold defaults to prod. Fix this as a config change, not a find-and-replace: `baseURL` should come from an env var so both environments stay usable.
- **A real test account exists on dev**, tied to `krishnaharshap11@gmail.com`, confirmed via account sign-in notification emails. Get the actual password from Krishna directly; do not attempt to provision or reset it yourself. It goes in `.env` as `VAULTCV_DEV_TEST_EMAIL` / `VAULTCV_DEV_TEST_PASSWORD`, following the existing pattern in `utils/test-users.ts`.
- **Google OAuth may or may not exist on dev.** It was observed on production on 2026-08-12; the login DOM captured on `app.vaultcv.com` earlier (2026-07-26) showed only email/password. Don't assume it exists on dev; confirm during Phase 0 below.
- **GitHub org access is unconfirmed.** An invitation to the `@vaultcv` GitHub org was sent 2026-08-12 with a 7-day expiry; as of this handoff's date that window has closed without a confirmation email on file. Do not assume source-repo access is available. If it turns out to be available, that unblocks `research/10_...` section 5's API-discovery workaround and should be preferred over network-trace reverse engineering, but verify access first rather than assuming.
- **Live DOM of dev.vaultcv.com is unverified.** The prior session's browser tooling disconnected before this could be checked. Every route and selector referenced below is a *hypothesis carried over from the prod findings*, not a confirmed fact about dev. Phase 0 exists specifically to close this gap; do not skip it and do not write real selectors into specs before completing it.

## Working conventions (carry forward, don't relitigate)

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`. Squash-merge into `main`. No branch protection is configured; use the convention as discipline, not enforcement.
- Commit messages: Conventional-Commits style (`feat: ...`, `fix: ...`), imperative mood, no tooling attribution of any kind (no "Generated with," no co-authorship trailers, no assistant branding anywhere in commit messages, PR descriptions, or code comments).
- Author identity: `krishnaharshap` with the existing noreply GitHub email. This is already the correct global git config; don't override it.
- No em dashes or other AI-generated writing tics in committed prose (docs, PR descriptions, code comments). Plain punctuation.
- Test-account creation is a human action. Do not write a spec, script, or CI step that self-serve creates a real account against dev or prod. TC-20260820-03 is about *observing* the signup gate, not exercising it end to end.

---

## Phase 0: Live verification (do this first, before writing new specs)

1. Run `npx playwright codegen https://dev.vaultcv.com` (or navigate manually and inspect) to capture real routes and selectors for: login, signup, the authenticated shell's entry point (confirm whether it's `/vault`, `/dashboard`, both, or something dev-specific), Story Wall, resume upload, JD input, the tailoring/generate action, and the download control.
2. Confirm whether dev sits behind the same Cloudflare tunnel as prod, or is a separate origin without that dependency. Adjust the health-gate fixture accordingly (it should still exist for dev; don't assume dev is exempt from infra flakiness).
3. Confirm whether Google OAuth is present on dev's login page.
4. Confirm whether `/signup` on dev is open, gated, or invite-only (observation only, per the constraint above).
5. Record findings by updating `test-plans/staging-e2e-test-plan-20260820.md` (fill in "Notes" columns with confirmed selectors/routes) rather than creating a parallel document.

Do not proceed to Phase 1 with placeholder selectors presented as final. If Phase 0 selectors remain unconfirmed for a given flow, keep the corresponding spec `test.skip`ed with a clear reason, exactly as the existing `story-wall.spec.ts` etc. already do.

## Phase 1: Config and environment

- `automation/playwright/playwright.config.ts`: `baseURL` should read from `process.env.VAULTCV_BASE_URL`, defaulting to `https://dev.vaultcv.com` for this phase (currently defaults to prod; that default should change since staging is now the active target, per the parent task).
- `automation/playwright/.env.example`: add `VAULTCV_DEV_TEST_EMAIL` / `VAULTCV_DEV_TEST_PASSWORD` alongside the existing prod vars. Keep both environments' credentials distinct; don't collapse them into one pair.
- `automation/playwright/package.json`: add `pdf-parse` as a devDependency (needed for Phase 1/F below). `@axe-core/playwright` is already present but unused; this phase is what wires it in.

## Phase 2: New and updated spec files

Each item maps to a test-plan section. Build in this order: A and B first (fastest to unblock, lowest risk), then C, D, E, F.

### `tests/auth.spec.ts` / `tests/auth.setup.ts` (update)
- Point at dev via the new `VAULTCV_BASE_URL` default.
- Add TC-20260820-02 (Google OAuth) as `test.skip` until Phase 0 confirms it exists; if confirmed, implement for real.
- Add TC-20260820-03 (signup gate observation), TC-20260820-04 (logout), TC-20260820-05 (invalid credentials), TC-20260820-06 (session expiry, likely `test.skip` until TTL is confirmed).

### `tests/ui-regression.spec.ts` (new)
- TC-07 through TC-11. Use Playwright's per-test `viewport` override (or dedicated projects: mobile/tablet/desktop) for TC-08.
- For TC-07, this is a regression check against `BUG-20260719-01` (open bug, `bug-reports/`). Do not mark that bug resolved based on this test alone; it's evidence, not a bug-closing authority.
- For TC-11, attach a `page.on('console', ...)` listener and fail on unhandled errors; keep the assertion scoped to genuinely unhandled errors, not benign warnings, so it doesn't become noisy and get ignored.

### `tests/accessibility.spec.ts` (new)
- TC-12 through TC-16. Use `@axe-core/playwright`'s `AxeBuilder` against `/login`, `/signup`, and the authenticated shell.
- Fail the build on `critical` and `serious` violations; log `moderate`/`minor` without failing, so the gate doesn't become unusable noise on day one.
- TC-14 (keyboard nav) and TC-15/16 (labels, contrast) can start as manual-assertion Playwright tests (check `getAttribute('aria-label')`, computed styles) rather than waiting on a larger a11y framework.

### `tests/navigation-integrity.spec.ts` (new)
- TC-17. Once Phase 0 confirms the real in-app navigation model, enumerate every primary nav entry and assert each resolves to real content (no 404, no blank panel). This test doubles as the practical resolution to the open routing question flagged in `research/10_...` section 6.3.

### `tests/story-wall.spec.ts`, `tests/resume-enrich.spec.ts`, `tests/job-match.spec.ts` (rewrite)
- These currently target confirmed-404 routes from the prod investigation (`research/10_...` section 1). Rewrite against whatever Phase 0 confirms for dev; do not assume the prod route guesses carry over.
- Fold in TC-18 (Story Wall to tailoring handoff), TC-19 (job to tailoring handoff), TC-20 (failed-API error surfacing), TC-21 (dead click targets) as new tests within these files rather than creating redundant files.

### `tests/resume-tailoring.spec.ts` (new)
- TC-22 through TC-28. This file should draw a hard line between two kinds of assertions and label which is which in comments:
  - **Mechanical** (this file's actual job): did the upload/parse/tailor pipeline run, did it produce non-empty output, did the UI reflect it. Use standard Playwright assertions.
  - **Quality/grounding** (TC-22, 23, 25, 26): these need rubric or golden-dataset grading per `eval-methodology.md` and belong to `automation/eval-harness/` once it exists (`research/10_...` section 7, item 6). Until that harness is built, do not fake a passing assertion with a superficial string check; instead write these as documented manual-verification steps or `test.fixme` with a comment pointing at the eval-harness backlog item. A fake-green test here is worse than an honest skip, given TC-25's fabrication risk.
- TC-24 (JS-rendered scraping) is a known failure area; write it to run and fail visibly, don't skip it, so it stays a tracked regression rather than silently rotting.
- TC-27 (malformed input) and TC-28 (SLA timing) are mechanical and can be fully automated now.

### `tests/document-download.spec.ts` (new)
- TC-29 through TC-35. Core pattern:
  ```ts
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /download/i }).click(),
  ]);
  const path = await download.path();
  ```
- TC-30/31 (file validity and content match): for PDF output, use `pdf-parse` to extract the text layer and assert it contains the expected tailored content (name, key tailored phrases). This is a mechanical content-presence check, not a quality eval; keep it that way, don't conflate it with section E's grading concerns.
- TC-32: enumerate whatever formats Phase 0 confirms exist; don't hardcode an assumption that DOCX exists if it doesn't.
- TC-33 through TC-35 are straightforward mechanical assertions (filename pattern, re-download diff, disabled-state check during generation).

## Phase 3: Fixtures and utilities

- `fixtures/sample-resume.pdf`: a small, non-sensitive sample resume for upload tests. Do not use anyone's real resume.
- `fixtures/sample-jd.txt` and `fixtures/malformed-jd.txt`: clean and garbage JD inputs for TC-23/27.
- A known JS-rendered job-posting URL for TC-24 (research one, document the source).
- `utils/download-helpers.ts`: wraps the download-and-verify pattern above so all of section F's tests share one implementation instead of five copies.
- `utils/axe-helpers.ts`: wraps `AxeBuilder` setup with the critical/serious-only failure policy described in Phase 2.

## Definition of done for this phase

- Phase 0 findings are recorded in the test plan, not left as open placeholders.
- `playwright.config.ts` targets dev by default; prod remains reachable via env var override.
- Every P0 case in sections A, B, D, and F either passes or is `test.skip`/`test.fixme` with a specific, named blocker (not a generic "TODO").
- Section E's quality-grading cases (TC-22, 23, 25, 26) are explicitly marked as not-yet-eval-graded rather than faked green.
- `@axe-core/playwright` actually runs somewhere (it currently doesn't, despite being a declared dependency).
- A real file downloads and gets validated at least once, end to end (TC-29 through TC-31 as a minimum bar for section F).
- All commits follow the branch/commit conventions above; nothing in the diff mentions AI tooling authorship.
