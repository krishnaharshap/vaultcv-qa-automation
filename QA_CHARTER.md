# VaultCV QA Charter

## Scope
VaultCV only. QA strategy, test planning, bug analysis/RCA, test documentation, automation setup, and tools evaluation. No content outside VaultCV QA/testing/automation.

## Architecture ground truth
- **Primary test target: https://app.vaultcv.com** — the customer product (Next.js App Router + React/TypeScript, Cloudflare-fronted).
- **In scope also: https://vaultcv.com** — marketing/landing page, on the **same Cloudflare infrastructure** as the app (both emit `/cdn-cgi/rum`). Custom-domain / Cloudflare / tunnel health checks are kept **unified** across both domains.
- **VaultCV is a memory-layer system built on Claude workflows** (see `knowledge-base/06_architecture_correction.md`). This supersedes the GitHub-repo/Azure-backend assumption used in the earlier brainstorming chats.
- Scope decisions and deprecations are recorded authoritatively in `knowledge-base/09_scope_and_deprecations.md`. Automation code targets **TypeScript** for consistency with the app, and is intended to be pushed to the `vaultcv` GitHub org.
- Test design must cover: standard E2E/UI/API/SQL/non-functional QA, **and** memory persistence/recall correctness, workflow execution correctness, and AI output quality (eval-driven testing — see `knowledge-base/07_openai_evals_reference.md`).

## Known open issues (carried from prior investigation, still open)
- Cloudflare Tunnel Error 1033 / HTTP 530 — tunnel health issue, blocks all live-site testing until resolved. Full RCA and bug report in `knowledge-base/03_chat_cloudflare_error_1033_analysis.md`.
- Job-scraping failures against JavaScript-rendered pages.
- UI corruption in the job-description field.

## Preferred tooling direction (re-validate against corrected architecture before committing)
- Playwright Test — core E2E/API execution engine.
- Schemathesis — OpenAPI/GraphQL edge and negative testing.
- Lighthouse CI + Chrome DevTools — performance/accessibility.
- k6 — API/load thresholds.
- OWASP ZAP Baseline + CodeQL — security smoke.
- GitHub Actions — CI execution, gating.
- Eval harness (rubric/model-graded) — AI output and memory/workflow correctness, run as a complementary suite alongside functional tests.

## Output rules
- Concise, direct, evidence-based. No filler, no emojis, no decorative formatting.
- Separate confirmed facts from assumptions and hypotheses.
- Bug reports use: Title, Severity/Priority, Environment, Issue Summary, Steps to Reproduce, Actual/Expected Result, Impact, Evidence, Probable Root Cause, Dev Discovery Checklist, Recommended Fix, Retest Criteria, Preventive Actions.
- Test cases use: ID, Title, Priority, Type, Preconditions, Test Data, Steps, Expected Result, Status, Notes.

## Folder map
```
VaultCV-QA/
  QA_CHARTER.md              <- this file
  knowledge-base/            <- exported chat history + architecture correction + evals reference
  test-plans/
  bug-reports/
  automation/playwright/
  automation/api-contracts/
  research/
  reports/
```
