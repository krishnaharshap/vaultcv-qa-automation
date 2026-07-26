# Test Plan: VaultCV E2E / Functional (app.vaultcv.com)

**Scope:** Deterministic "did it work mechanically" coverage of the five priority user flows on the customer product: authentication (login/signup/logout), Story Wall create/edit, resume upload → enrichment, job add → match, and the account/vault dashboard. Backed by the Playwright suite in `automation/playwright/`.

**Out of scope (covered by separate suites, not this plan):**
- AI output *quality* — Story Wall narratives, job-match relevance, resume-bullet tailoring, job parsing. These need rubric/golden-dataset grading, not exact-match assertions → eval harness (`vaultcv-eval-harness-design`, `references/eval-methodology.md`).
- AI *safety* — PII leakage, prompt injection, fabrication, cross-user memory bleed → guardrails suite (`vaultcv-guardrails-design`).
- API contract / SQL / non-functional (perf, load, a11y depth) — pre-staged, blocked on repo/API access. Basic `@axe-core/playwright` scans fold into this suite later.
- Full landing-page QA of `vaultcv.com` (render/CTA/SEO) — dropped as core scope per ground truth; only unified Cloudflare uptime is retained.

**Environment:** `https://app.vaultcv.com` (Next.js App Router + React/TS, Cloudflare-fronted). Runs headless across chromium/firefox/webkit. Auth uses a disposable test account via env vars (`.env`, gitignored). Live-DOM status as of 2026-07-26: site reachable at edge (no active 1033/530), login and signup DOM inspected and selectors confirmed.

**Known blockers / preconditions:**
- **Cloudflare Tunnel 1033 / HTTP 530** (known open issue). The suite gates every run on a health check (`health` project) so an edge outage is reported as one distinct failure, not a wave of unrelated test failures. If the gate fails, treat all downstream results as infra-caused.
- **Authenticated-flow selectors unconfirmed.** Story Wall, resume, and job specs use placeholder `data-testid`s and are skipped until a logged-in DOM pass replaces them.
- **Job-description field UI corruption** and **JS-rendered job-scraping failure** are known open issues — the relevant cases are written as regression flags, expected to fail until fixed.

## Test Cases

| ID | Title | Priority | Type | Preconditions | Test Data | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TC-20260726-01 | Cloudflare edge/tunnel health gate | P0 | Non-functional | Base URL reachable | VAULTCV_BASE_URL | 1. GET base URL<br>2. Inspect status | Not 530/1033; 2xx or 3xx = edge up. Gates the rest of the run. | Not Run | Confirmed passing 2026-07-26 (site up). `cloudflare-health.spec.ts`. |
| TC-20260726-02 | Login form renders required fields | P1 | E2E | Site up | none | 1. Go to /login<br>2. Assert email, password, Sign in, Create one link | All present; Create one → /signup | Not Run | Real selectors (live DOM). Runnable green now. `auth.spec.ts`. |
| TC-20260726-03 | Signup form renders required fields | P1 | E2E | Site up | none | 1. Go to /signup<br>2. Assert email, password, repeat-password, Create account | All present | Not Run | Real selectors (live DOM). Runnable green now. |
| TC-20260726-04 | Login with valid credentials leaves /login | P0 | E2E | Test account exists; creds in .env | VAULTCV_TEST_EMAIL/PASSWORD | 1. Go to /login<br>2. Fill creds<br>3. Sign in | Redirects away from /login | Not Run | Skips without creds. TODO: assert exact landing route. |
| TC-20260726-05 | Login with invalid credentials stays on /login, no crash | P1 | E2E | Site up | bad email/password | 1. Go to /login<br>2. Fill bad creds<br>3. Sign in | Stays on /login; error shown, no navigation/throw | Not Run | TODO: assert real error element/copy once inspectable. |
| TC-20260726-06 | Logout clears session and blocks protected routes | P1 | E2E | Authenticated session | test account | 1. Log in<br>2. Log out<br>3. Hit protected route | Redirected to login; no protected content | Not Run | Skipped — logout control/redirect unconfirmed. |
| TC-20260726-07 | Story Wall — create new entry | P1 | E2E | Authenticated | short narrative text | 1. Open Story Wall<br>2. New entry<br>3. Enter text<br>4. Save | Entry persists and is visible | Not Run | Placeholder selectors; skipped pending authed DOM pass. Quality → eval harness. |
| TC-20260726-08 | Story Wall — edit existing entry | P2 | E2E | Authenticated; entry exists | edited text | 1. Select entry<br>2. Edit<br>3. Save | Update persists | Not Run | Skipped — entry-selection selector unconfirmed. |
| TC-20260726-09 | Story Wall — malformed input handled gracefully | P2 | E2E | Authenticated | empty/oversized/special-char input | 1. Enter malformed input<br>2. Save | Graceful validation, no crash | Not Run | Mechanical robustness only; injection case → guardrails. |
| TC-20260726-10 | Resume upload triggers enrichment to completion | P1 | E2E | Authenticated | sample-resume.pdf | 1. Open resume<br>2. Upload<br>3. Enrich | Status reaches "complete", no error | Not Run | Placeholder; needs sample file + real SLA. Content quality → eval harness. |
| TC-20260726-11 | Enrichment failure surfaces a clear error | P2 | E2E | Authenticated; failure trigger | fault-inducing input | 1. Trigger enrichment failure | Clear error, not a silent hang | Not Run | Needs a reliable failure trigger. |
| TC-20260726-12 | Add job by pasting a job description | P1 | E2E | Authenticated | JD text | 1. Open jobs<br>2. Add job<br>3. Paste JD<br>4. Save | Job persists; JD renders intact | Not Run | Watch job-description field UI corruption (known issue). |
| TC-20260726-13 | Add job by URL (scraping) — JS-rendered page | P1 | E2E | Authenticated | known JS-rendered posting URL | 1. Add job by URL<br>2. Scrape | Fields populate | Not Run | Regression flag — expected to fail until scraping fix lands (known issue). |
| TC-20260726-14 | Job-match score reflects an obvious relevance signal | P2 | E2E | Authenticated; job + resume present | matched vs unmatched pair | 1. Trigger match<br>2. Read score | Score reflects relevance direction | Not Run | Mechanical presence only; relevance accuracy → eval harness. |
| TC-20260726-15 | Dashboard / vault loads authenticated content | P1 | E2E | Authenticated | test account | 1. Go to dashboard/vault | Authed content renders; no error state | Not Run | To add once landing route confirmed (TC-04 dependency). |

## Eval / Guardrail Considerations

VaultCV is a memory-layer system on Claude workflows, so this functional suite is only half the pyramid. The AI-generated surfaces above (Story Wall, resume enrichment, job match, job scraping) must not be graded by the exact-match assertions used here — pass/fail on those belongs to the eval harness (rubric + golden dataset, per `references/eval-methodology.md`) and the guardrails suite. Specifically, keep out of this plan and route to the AI suites:
- **Grounding / no-fabrication** — every generated claim traceable to real user input (fabrication risk).
- **Cross-user memory bleed** — signature risk of the memory-layer architecture; needs a two-user harness, not a single-session E2E.
- **Prompt injection** via resume, JD, or free-form Story Wall text.
- **PII leakage** into logs/responses across users/sessions.

This plan's job is to prove the mechanics work so the eval/guardrail runs are measuring real feature behavior and not tripping over a broken UI.

## Traceability

Each TC maps to `automation/playwright/tests/`: TC-01 → `cloudflare-health.spec.ts`; TC-02..06 → `auth.spec.ts` (+ `auth.setup.ts`); TC-07..09 → `story-wall.spec.ts`; TC-10..11 → `resume-enrich.spec.ts`; TC-12..14 → `job-match.spec.ts`; TC-15 → to be added. Design basis: `research/08_autonomous_test_automation_design.md` §6.
