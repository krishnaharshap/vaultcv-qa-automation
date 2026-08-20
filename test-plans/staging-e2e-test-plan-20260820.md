# Test Plan: VaultCV Staging E2E (dev.vaultcv.com)

**Scope:** Full E2E coverage of the staging environment across six areas: test accounts/authentication, UI flaws, accessibility, functionality disconnects, the resume-tailoring workflow (core USP), and document download. Target: `https://dev.vaultcv.com`.

**Out of scope:** Production (`app.vaultcv.com`) coverage, already tracked in `test-plans/e2e-functional-test-plan-20260726.md`. Building the eval-harness grader code itself (separate backlog item, see `research/10_phase2_e2e_implementation_plan.md` section 7, item 6). A full manual WCAG 2.2 AA audit (section C below is an automated floor, not complete coverage).

**Environment:** `https://dev.vaultcv.com`. A real test account is confirmed active for `krishnaharshap11@gmail.com` (sign-in alert emails from `noreply@dev.vaultcv.com` dated 2026-08-15 and 2026-08-20). Google OAuth was also used against `vaultcv.com` production on 2026-08-12, confirming an OAuth path exists somewhere in the product; whether dev exposes the same option is unconfirmed.

**Known blockers:**
- Live DOM of `dev.vaultcv.com` was not inspected while writing this plan (Chrome browser tooling was disconnected this session). Routes and selectors below carry over the confirmed `app.vaultcv.com` findings from `research/10_phase2_e2e_implementation_plan.md` as a starting hypothesis only. Dev can diverge from prod; re-verification against dev specifically is the first implementation task, not optional.
- Cloudflare tunnel health (known issue, `knowledge-base/03_chat_cloudflare_error_1033_analysis.md`) applies to prod; unconfirmed whether dev sits behind the same tunnel. Gate dev runs on a health check regardless, using the same pattern as `automation/playwright/fixtures/cloudflare-health.ts`.
- Test-account creation is a human-provisioned action, not something automation performs. Any case below involving new-account creation is for *observing* signup gate behavior, not for self-serve provisioning inside CI.

---

## A. Test Accounts & Authentication

| ID | Title | Priority | Type | Preconditions | Test Data | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TC-20260820-01 | Existing dev test account logs in successfully | P0 | E2E | Credentials in `.env`; dev reachable | `VAULTCV_DEV_TEST_EMAIL`/`PASSWORD` | 1. Go to dev login<br>2. Enter credentials<br>3. Submit | Redirect to authenticated shell | Not Run | Account confirmed real and active via inbox sign-in alerts. Get actual credentials from Krishna; never hardcode or commit. |
| TC-20260820-02 | Google OAuth sign-in works on dev (if offered) | P1 | E2E | Google test identity available | n/a | 1. Look for "Sign in with Google" on dev login<br>2. Complete OAuth if present<br>3. Confirm authenticated session | Authenticated session established, or confirmed absent on dev | Not Run | Discovered via inbox: Google OAuth was used on production 2026-08-12. The `app.vaultcv.com` DOM captured 2026-07-26 showed only email/password, no Google button. Could be prod-only, or added since. Confirm on dev before writing real selectors. |
| TC-20260820-03 | Signup flow: confirm dev's gating behavior | P1 | Functional | dev reachable | n/a (observe only, do not complete with real data) | 1. Go to dev `/signup`<br>2. Observe whether the form is reachable/functional or gated | Documented finding: dev bypasses the marketing waitlist funnel (`research/10_...`, section 2), or enforces its own gate | Not Run | Do not submit this form to create a real account inside an automated run. Provisioning is a human decision. |
| TC-20260820-04 | Logout clears session and blocks protected routes | P1 | E2E | Authenticated session | test account | 1. Log in<br>2. Log out<br>3. Attempt to reach a protected route | Redirected to login; no protected content served | Not Run | |
| TC-20260820-05 | Invalid credentials show a graceful error | P2 | E2E | dev reachable | bad email/password | 1. Go to login<br>2. Submit invalid credentials | Stays on login; visible error; no crash/blank state | Not Run | |
| TC-20260820-06 | Session/token expiry redirects cleanly | P2 | Non-functional | Authenticated, idle past TTL | n/a | 1. Authenticate<br>2. Idle past session TTL<br>3. Attempt an action | Redirected to login; no silent failure or data loss on in-progress work | Not Run | Session TTL unconfirmed; ask dev team. |

## B. UI Flaws / Visual Regression

| ID | Title | Priority | Type | Preconditions | Test Data | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TC-20260820-07 | Job-description field renders long pasted text cleanly | P0 | Functional | Authenticated | JD text >= 2000 chars | 1. Open job-add flow<br>2. Paste long JD text | Text renders without overlap/garbling; stored value matches pasted input | Not Run | Regression check for `BUG-20260719-01` (open, tracked). Do not close that bug until this passes. |
| TC-20260820-08 | Responsive layout holds at common viewport widths | P1 | Functional | Authenticated | n/a | 1. Load login, signup, and the main authenticated shell at 375px/768px/1440px widths | No overlapping/clipped elements at any width | Not Run | |
| TC-20260820-09 | Loading/empty/error states are visually distinct | P1 | Functional | Authenticated | n/a | 1. Trigger loading, empty, and error states on Story Wall, resume, and job sections | Each state is visibly distinct; never a blank white screen | Not Run | |
| TC-20260820-10 | Form validation error styling is visible and field-associated | P1 | Functional | n/a | invalid form input | 1. Submit login/signup/job-add forms with invalid data | Error styling appears, associated with the correct field | Not Run | |
| TC-20260820-11 | No unhandled console errors on core screen loads | P2 | Non-functional | Authenticated | n/a | 1. Load each core authenticated screen<br>2. Capture browser console | Zero unhandled JS errors logged | Not Run | Use `page.on('console')` / `read_console_messages`-equivalent in Playwright. |

## C. Accessibility

| ID | Title | Priority | Type | Preconditions | Test Data | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TC-20260820-12 | Axe scan: `/login` and `/signup` have zero critical/serious violations | P1 | Functional | dev reachable | n/a | 1. Run `@axe-core/playwright` against both pages | Zero critical/serious violations | Not Run | Dependency already declared in `package.json`, not yet wired into any spec. |
| TC-20260820-13 | Axe scan: authenticated shell has zero critical/serious violations | P1 | Functional | Authenticated | n/a | 1. Run axe against the main authenticated view(s) | Zero critical/serious violations | Not Run | |
| TC-20260820-14 | Keyboard-only navigation completes login and resume upload | P2 | Functional | Authenticated where relevant | n/a | 1. Navigate login and resume-upload using keyboard only | Flow completes; focus indicator visible at every step | Not Run | |
| TC-20260820-15 | Form inputs have programmatic labels | P2 | Functional | n/a | n/a | 1. Inspect email/password/JD/resume-upload inputs for associated `<label>` or `aria-label` | All inputs labeled | Not Run | |
| TC-20260820-16 | Primary CTA color contrast meets WCAG AA | P2 | Functional | n/a | n/a | 1. Check contrast ratio of Sign in, Create account, Download, and Tailor buttons | Meets 4.5:1 for text | Not Run | |

## D. Functionality Disconnects

| ID | Title | Priority | Type | Preconditions | Test Data | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TC-20260820-17 | All primary in-app navigation resolves to real content | P1 | Functional | Authenticated | n/a | 1. Click through every primary nav entry in the authenticated shell | No 404s or blank panels | Not Run | Directly tests the open routing question in `research/10_...` section 6.3 (is Story Wall/resume/jobs a tab set inside `/vault`, or something else). |
| TC-20260820-18 | Story Wall data is available when generating a tailored resume | P0 | Functional | Authenticated; Story Wall entry exists | Story Wall content | 1. Add a Story Wall entry<br>2. Start resume tailoring | Story Wall content is reflected/used in tailoring, not siloed | Not Run | Tests the core value-proposition plumbing, not just isolated screens. |
| TC-20260820-19 | A job added via JD paste is selectable as a tailoring target | P0 | Functional | Authenticated | JD text | 1. Add a job via pasted JD<br>2. Start resume tailoring against that job | Job appears as a valid tailoring target | Not Run | |
| TC-20260820-20 | Failed API calls surface a visible error, not a silent failure | P1 | Functional | Authenticated | forced failure (offline mode, or known-bad input) | 1. Force an API call to fail<br>2. Observe UI | Visible error shown to user; no silent hang or blank result | Not Run | |
| TC-20260820-21 | Enabled-looking buttons are actually actionable | P2 | Functional | Authenticated | n/a | 1. Click every visibly enabled control in the core authenticated shell | Each control performs its action; no dead click targets | Not Run | |

## E. Resume Tailoring Workflow (Core USP)

This is the product's stated differentiator. Per `vaultcv-qa`'s eval methodology (`references/eval-methodology.md`), the generated content itself is **not** exact-match testable. This table splits each case into what a mechanical Playwright assertion can check (did the pipeline run, is output non-empty, did the UI update) versus what needs rubric/golden-dataset grading (is the output actually good and grounded), per `Type`.

| ID | Title | Priority | Type | Preconditions | Test Data | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TC-20260820-22 | Resume upload parses into structured fields without dropped/garbled sections | P0 | Eval | Authenticated | sample resume file | 1. Upload resume<br>2. Inspect parsed fields | Grading criteria: field-level completeness vs. source resume (name, roles, dates, skills), not a fixed string | Not Run | |
| TC-20260820-23 | JD parsing from pasted plain text extracts key requirements accurately | P0 | Eval | Authenticated | sample JD text | 1. Paste JD text<br>2. Inspect extracted requirements/skills | Grading criteria: extracted set matches a human-labeled reference | Not Run | |
| TC-20260820-24 | JD parsing from a JS-rendered job-posting URL succeeds | P1 | Functional (regression flag) | Authenticated | known JS-rendered job URL | 1. Add job by URL<br>2. Trigger scrape | Fields populate | Not Run | Known failure area (`knowledge-base` ground truth). Expected to fail until fixed; keep in the suite as a tracked regression, not a silent skip. |
| TC-20260820-25 | Tailored resume bullets are grounded, zero fabrication | P0 | Guardrail + Eval | Authenticated; resume + JD present | resume + JD pair | 1. Generate tailored resume<br>2. Compare every claim against source resume/Story Wall data | Zero fabricated employers, titles, skills, or dates | Not Run | Highest-priority AI-safety case for the USP. Fabrication here is a trust and potential career-document-integrity risk, not just a quality miss. |
| TC-20260820-26 | Tailored output measurably aligns to the target JD vs. an untailored baseline | P0 | Eval | Authenticated | resume + JD pair | 1. Generate tailored output<br>2. Score relevance/keyword alignment against the JD<br>3. Compare to the untailored baseline resume | Tailored output scores meaningfully higher than baseline | Not Run | This is the literal value-proposition test: tailoring must beat doing nothing, not just look different. |
| TC-20260820-27 | Malformed/garbage JD input is handled gracefully | P2 | Functional + Guardrail | Authenticated | empty, non-English, and binary-paste JD inputs | 1. Submit each malformed input as a JD | No crash; no nonsense tailored output produced from garbage input | Not Run | |
| TC-20260820-28 | End-to-end tailoring run completes within an agreed SLA | P2 | Non-functional | Authenticated | resume + JD pair | 1. Time upload-to-tailored-output | Completes within the SLA | Not Run | SLA not yet defined; confirm with dev/product. |

## F. Document Download

The tailored, downloadable resume is the actual deliverable the product sells. A correct on-screen result that downloads wrong is still a shipped defect.

| ID | Title | Priority | Type | Preconditions | Test Data | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TC-20260820-29 | Download produces a real file via a genuine browser download event | P0 | E2E | Authenticated; tailored output exists | n/a | 1. Click Download<br>2. Capture the `download` event | A real file downloads; no broken link or blob error | Not Run | Use Playwright `page.waitForEvent('download')`. |
| TC-20260820-30 | Downloaded file opens without corruption | P0 | Functional | Downloaded file from TC-29 | n/a | 1. Inspect the downloaded file | Non-empty, valid file (byte-size sanity check minimum; text-layer extraction for PDF) | Not Run | |
| TC-20260820-31 | Downloaded file content matches the on-screen tailored resume | P0 | Functional | Downloaded file from TC-29 | n/a | 1. Compare downloaded content to on-screen content | Content matches; no truncation, no stale/cached prior version | Not Run | Ties directly to TC-26. |
| TC-20260820-32 | Each offered export format produces a valid file | P1 | Functional | Authenticated | n/a | 1. Download in every format the UI offers (PDF confirmed likely; DOCX if present) | Each format downloads a valid file | Not Run | Confirm which formats actually exist during live verification. |
| TC-20260820-33 | Downloaded filename is meaningful | P3 | Functional | Downloaded file | n/a | 1. Inspect filename | Reflects the tailored job/resume context; not `undefined.pdf` or a raw UUID | Not Run | |
| TC-20260820-34 | Re-download after an edit reflects the update | P2 | Functional | Authenticated; prior download exists | edited resume | 1. Edit tailored output<br>2. Re-download | New file reflects the edit; not a cached stale version | Not Run | |
| TC-20260820-35 | Download control shows busy/disabled state during generation | P2 | Functional | Authenticated | n/a | 1. Trigger generation<br>2. Click Download rapidly during generation | No double-submit or duplicate downloads | Not Run | |

## Eval / Guardrail Considerations

Sections E and F carry this plan's highest-priority cases because they test the product's actual USP, not incidental UI polish. TC-25 and TC-26 in particular should not be treated as "nice to have": a tailoring product that fabricates experience or fails to out-perform an untailored baseline has no product. Per `eval-methodology.md`, these need a golden dataset (human-labeled resume/JD/expected-output triples) before they can run unattended; until that dataset exists, run them manually and record findings as bug reports using the locked template, don't let the gap go undocumented. See `research/10_phase2_e2e_implementation_plan.md` section 7, item 6 for the eval-harness scaffolding backlog.

## Traceability

Maps to `automation/playwright/tests/`: A to `auth.spec.ts`/`auth.setup.ts`; B to a new `ui-regression.spec.ts`; C to a new `accessibility.spec.ts`; D to a new `navigation-integrity.spec.ts` plus updates to the existing feature specs; E to a new `resume-tailoring.spec.ts`; F to a new `document-download.spec.ts`. Full implementation instructions: `research/11_dev_staging_handoff_for_claude_code.md`.
