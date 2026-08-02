# Phase 2 Implementation Plan: VaultCV E2E / Automation Framework

Date: 2026-08-01
Purpose: handoff document for the next coding session. Summarizes confirmed live-UI findings that correct the current scaffold, gap-checks the automation framework against three references (`engineering:testing-strategy`, `vaultcv-qa` ground truth, `vaultcv-e2e-design`), and lays out sequenced, scoped work.

---

## 1. Confirmed live-UI ground truth (corrects the existing scaffold)

Live inspection of `https://app.vaultcv.com` and `https://vaultcv.com` on 2026-08-01, unauthenticated (no test credentials available this session).

| Route | Result | Notes |
|---|---|---|
| `/` | Redirects to `/login` | Root requires auth. |
| `/login` | **Real, public.** Fields: `input[type="email"]` (placeholder "you@example.com"), `input[type="password"]`, button "Sign in", link "Create one" to `/signup`. Copy: "Sign in to your career vault." | Confirmed 2026-07-26, re-confirmed today. |
| `/signup` | **Real, public.** Fields: email, `input[type="password"]` (placeholder "Min. 8 characters"), confirm password ("Repeat password"), button "Create account", link "Sign in" to `/login`. | Confirmed 2026-07-26. |
| `/vault` | **Real, protected.** Server-side redirect to `/login` when unauthenticated. Login-page copy under this route reads: "Access your Story Wall, applications, and enriched resume data." | Key finding: this sentence implies Story Wall, job applications, and resume data are sections/tabs inside a single `/vault` shell, not separate top-level routes. |
| `/dashboard` | **Real, protected.** Redirects to `/login`, but client-side (slower; the page briefly renders an empty shell before the redirect completes, unlike `/vault`'s immediate server-side redirect). | Distinct route from `/vault`; both protected. Relationship between the two (alias vs. different landing pages) unconfirmed. |
| `/onboarding` | **Real, protected.** Redirects to `/login`. | Likely a first-run flow post-signup. Unconfirmed. |
| `/story-wall`, `/jobs`, `/resume`, `/account`, `/vault/story-wall`, `/vault/jobs`, `/vault/resume`, `/forgot-password` | **All genuine 404** (Next.js "This page could not be found" page, not an auth redirect). | These are the routes the current scaffold (`tests/story-wall.spec.ts`, `resume-enrich.spec.ts`, `job-match.spec.ts`) guesses at goto(). They are wrong and must not be used as-is. No password-reset route exists at the guessed path either; no "forgot password" link is visible on `/login`, so a reset flow may not exist yet, or is surfaced differently. Confirm with product before writing a test for it. |
| `/robots.txt` | Cloudflare-managed default; blocks AI crawlers (ClaudeBot, GPTBot, etc.) from training/indexing. No custom sitemap. | Not useful for route discovery beyond ruling out a sitemap shortcut. |

Confirmed: the real authenticated surface is a single `/vault` (and/or `/dashboard`) shell; Story Wall, resume, and job features live inside it via client-side navigation (tabs, panels, or a nested router not exposed as distinct top-level Next.js routes). The exact in-app navigation (URL fragments, query params, or pure client state) is unconfirmed and requires an authenticated session to inspect.

## 2. New finding: gated beta, not self-serve signup

`https://vaultcv.com` (marketing site) has no direct link into `/signup`. Both of its calls to action, "Get Access" and "I want to try," point to an external Google Form (`forms.gle/...`), not the app. This means:

- Confirmed: public user acquisition is currently a waitlist funnel (landing page to Google Form), not self-serve signup, even though `/signup` exists and is reachable directly.
- Hypothesis: `/signup` may be gated behind an invite/allowlist server-side (untested; would need to actually submit the form to confirm), or it may work for anyone who navigates to it directly and the Google Form is just the current marketing funnel.
- Impact on this plan: disposable test-account provisioning cannot be assumed to be "just sign up via the form" for CI automation. This raises the priority of the open item already flagged in the E2E README: confirm with the team whether a test-mode/bypass flag or a direct-provisioning path exists for QA, rather than relying on the public funnel.

## 3. Current framework inventory (what exists today)

- `automation/playwright/`: Playwright scaffold with health gate, storageState auth setup, `auth.spec.ts` (real, confirmed selectors, 2 tests runnable green today), and `story-wall.spec.ts` / `resume-enrich.spec.ts` / `job-match.spec.ts` (all `test.skip`ed, placeholder selectors, and now confirmed-wrong routes, see section 1).
- `test-plans/e2e-functional-test-plan-20260726.md`: 15 test cases, both pyramid halves separated, traceable to spec files.
- No eval harness, no guardrails suite, no API/contract tests, no CI workflow, no test-data fixtures directory.

## 4. Gap analysis

### 4.1 Against `engineering:testing-strategy` (pyramid framing)

The standard pyramid (unit, integration, E2E) doesn't map cleanly onto a QA-owned black-box repo with no source access; there are no unit tests here by design. Reframed for this repo's actual position in VaultCV's stack:

- Missing: an explicit statement of what this repo does not cover (unit/component tests, which belong in the app repo, not here) so scope stays honest. Add to `automation/playwright/README.md`.
- Missing: coverage targets and exit criteria. The design doc and test plan list flows but never state "how much is enough" (e.g., all P0/P1 cases green plus health gate green as the CI merge gate). Needs a decision, not just a document; flagged as an open decision in section 6.
- Present, correctly scoped: business-critical paths (auth, Story Wall, resume, jobs) are prioritized over trivial coverage, consistent with "what to cover" guidance.

### 4.2 Against `vaultcv-qa` ground truth

- Missing, eval harness. Zero golden-dataset examples exist for any of the four AI features (Story Wall, job matching, resume enrichment, job scraping). Per `eval-methodology.md`, this is the hard blocker; no eval can run without it. Nothing in `automation/` addresses this yet (`vaultcv-eval-harness-design` skill hasn't been invoked).
- Missing, guardrails suite. No prompt-injection, PII-leakage, fabrication, or cross-user memory-bleed test scaffolding exists. Memory-bleed testing needs two test accounts (store as A, probe as B); provisioning is doubly blocked now given section 2.
- Missing, API/SQL validation. Explicitly pre-staged, not started, per the design doc. Still blocked on endpoint/repo access; see section 5 for a workaround.
- Partially addressed, known issues. The Cloudflare health gate is built. Job-description-field corruption and JS-rendered scraping failure are referenced as regression flags in `job-match.spec.ts`, but both specs are skipped, so they aren't actually exercised yet.
- Present, correct format: the test plan follows the locked template (TC IDs, both pyramid halves, eval/guardrail cross-references).

### 4.3 Against `vaultcv-e2e-design`

- Blocking gap: the three feature specs target routes confirmed 404 (section 1). This isn't a "selectors are placeholders" gap anymore; it's a route-model gap. The specs need to be rewritten against `/vault` (or `/dashboard`) as a single shell with in-app navigation, once that navigation model is confirmed.
- Missing: `@axe-core/playwright` is declared as a devDependency but not wired into any spec; accessibility scans aren't actually running anywhere.
- Missing: test-data fixtures. No sample resume file, no known JS-rendered job-posting URL, no seeded JD text file. `resume-enrich.spec.ts` references a file path that doesn't exist.
- Missing: CI wiring (GitHub Actions). The design doc calls for this in step 6; nothing has been added to `.github/workflows/`.
- Open, unresolved from the original design doc: how each AI feature is invoked in isolation, the memory-layer input/output contract, and DB/storage access for direct validation. None of these can be resolved from the live DOM alone; they need dev/product input.

## 5. Recommended workaround for the API/repo access blocker

Since direct repo/API access isn't available, the fastest unblock is not waiting on it: once a test account exists, an authenticated Chrome DevTools network trace (Network tab, or the Claude-in-Chrome `read_network_requests` tool if driven interactively) during each of the four core flows will reveal the real Next.js Route Handler endpoints, request/response shapes, and auth-header scheme empirically. This is the same method already used to confirm the Next.js/Cloudflare stack in the original design doc. It turns "blocked on API access" into "blocked on one authenticated session," a much smaller ask of the team.

## 6. Open decisions needed before coding resumes

These need a person (Krishna, or dev/product), not another automation pass:

1. Test-account provisioning. Given the waitlist funnel (section 2): is there a QA-specific path to get a real or synthetic test account (admin-created, test-mode flag, or direct DB seed), or must QA go through the public form like any user?
2. `/vault` vs `/dashboard`. Are these the same authenticated shell under two routes, or genuinely different landing surfaces? Determines whether both need separate coverage or one is a legacy alias.
3. In-app navigation model for Story Wall, resume, and jobs. Are these tabs within `/vault`, modal overlays, or a client-side router with non-Next.js paths? Needs one authenticated screen-share or session to observe.
4. CI merge-gate definition. What must be green before a PR can merge: health gate plus P0/P1 E2E only, or eventually evals/guardrails too? Affects how `deploy-checklist`-style gating gets configured.
5. Password reset. Confirm whether this feature exists at all before writing a test for it.

## 7. Sequenced next-phase backlog

Scoped so each item is a single small PR, following the branch-naming convention already in use (`feat/`, `fix/`, `chore/`, `docs/`; squash-merge into `main`; commit messages in imperative mood, no tooling attribution).

| # | Branch | Work | Blocked by |
|---|---|---|---|
| 1 | `chore/e2e-fixtures-scaffold` | Add `fixtures/` test-data directory: sample resume PDF, seeded JD text, a known JS-rendered job-posting URL for the scraping regression case. | Nothing, can start now. |
| 2 | `fix/e2e-route-model` | Rewrite `story-wall.spec.ts`, `resume-enrich.spec.ts`, `job-match.spec.ts` against the real `/vault` shell once decision 6.3 is answered; remove the confirmed-404 route guesses. | Decision 6.3 |
| 3 | `feat/e2e-authenticated-selectors` | Authenticated DOM pass: log in with a real test account, capture real selectors/testids for Story Wall, resume, jobs, dashboard. | Decision 6.1 |
| 4 | `feat/e2e-a11y-scans` | Wire `@axe-core/playwright` into the auth and (once unblocked) feature specs. | Nothing, can start now for `/login` and `/signup`. |
| 5 | `feat/api-endpoint-discovery` | Authenticated network-trace session (section 5) to document real API endpoints, request/response shapes, auth scheme. Write findings to a new `knowledge-base` doc. | Decision 6.1 |
| 6 | `feat/eval-harness-scaffold` | Invoke `vaultcv-eval-harness-design` to scaffold `automation/eval-harness/`; begin collecting the first golden-dataset examples (target 20-50 per feature, per the design doc). | Nothing structural; dataset collection can start now using whatever real outputs are available. Full build benefits from item 5. |
| 7 | `feat/guardrails-scaffold` | Invoke `vaultcv-guardrails-design` (once available) to scaffold `automation/guardrails/`, starting with cross-user memory-bleed and Story Wall prompt-injection cases. | Decision 6.1 (needs two test accounts) |
| 8 | `chore/ci-github-actions` | Add `.github/workflows/e2e.yml` running the health gate plus auth spec (the parts that don't need credentials) on every PR; expand once item 3 lands. | Nothing for a minimal version; full gate needs decision 6.4. |
| 9 | `docs/scope-update` | Update `QA_CHARTER.md` and `README.md` folder map to reflect the eval-harness and guardrails directories once they exist. | Items 6, 7 |

Items 1, 4, and a minimal version of 8 have no blockers and are ready to hand to a coding session today. Everything else needs at least one answer from section 6.
