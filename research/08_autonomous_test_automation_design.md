# VaultCV Autonomous Test Automation — Design & Thinking Session

Status: **thinking/brainstorming only.** No skills, code, or scaffolding created yet. This document captures confirmed findings and proposed skeletons so the actual build can start the moment repo/API access lands.

---

## 1. Confirmed stack findings (from live inspection of app.vaultcv.com/login)

- **Frontend: Next.js, App Router.** Network trace shows `_next/static/chunks/app/...`, `app/(auth)/login/page-*.js` (route groups = App Router), `main-app-*.js`, `layout-*.js`, webpack runtime chunk. This is React under the hood.
- **Language: TypeScript** (standard for a Next.js App Router app of this shape; confirm by reading the private repo when access lands).
- **Edge/hosting: Cloudflare** — `cloudflareinsights.com` beacon + `/cdn-cgi/rum` Real User Monitoring POST. Consistent with the earlier Cloudflare Tunnel 1033 incident.
- **Two domains, different roles:**
  - `vaultcv.com` — marketing/landing (the old public `vaultcv.github.io` React/Vite repo).
  - `app.vaultcv.com` — the actual product (Next.js). **This is the QA target.**
- **API shape:** no `/api/...` calls fire on the login page; auth/API calls trigger on form submit. Map the real endpoint structure (likely Next.js Route Handlers under `app/api/...`) once repo/API access is granted.
- **Architecture (per your correction):** memory-layer system built on Claude workflows. The AI features are the primary quality risk, not the CRUD UI.

## 2. Language decision — TypeScript across the board

For consistency with the Next.js/TS source: **TypeScript is the automation language.**
- Playwright is TS-native → E2E consistency, shared types with the app if the repo is a monorepo.
- Eval + guardrail harnesses also in TS keeps one toolchain, one CI setup, one dependency story. (Python is viable for evals if the team prefers data-science tooling later, but defaulting to TS avoids a second ecosystem — matters for a no-budget startup with a small team.)

## 3. Testing philosophy for an AI product

Two orthogonal questions, both needed:
- **"Did it work mechanically?"** → functional/E2E (Playwright), API contract, SQL validation. Deterministic, exact-match assertions.
- **"Was the AI output actually good and safe?"** → evals (quality) + guardrails (safety). Non-deterministic; graded against a **human-labeled golden dataset** (your chosen oracle), with similarity/rubric scoring rather than exact match.

The golden dataset is the backbone. Every AI feature needs a curated set of `input → known-good output` (and known-bad, for guardrails). This is the single most valuable early asset — it makes autonomy possible, because it's what lets a test pass/fail without a human in the loop each run.

---

## 4. Skill skeleton #1 — Eval Harness (AI output quality)

**Purpose:** score VaultCV's AI feature outputs against the golden dataset and catch quality regressions when prompts/workflows/memory change.

**Eval targets (from interview):**
1. **Story Wall / narrative generation** — career narratives from memory-layer input.
2. **Job matching / JD analysis** — resume↔job relevance.
3. **Resume enrichment / bullet tailoring** — rewrites/enhancements.
4. **Job scraping / parsing** — structured extraction from external job pages (known failure area).

**Grading approach:** golden dataset (human-labeled) as anchor. Per output type:
- Story Wall & resume bullets → similarity + rubric fields (factual grounding in the user's real data, no fabrication, tone, completeness). Since these are open-ended, pair the golden reference with rubric scoring.
- Job matching → relevance score vs labeled match/no-match.
- Scraping/parsing → structured-field exact/fuzzy match against labeled expected extraction.

**Proposed skeleton (design, not built):**
```
skills/vaultcv-eval-harness/
  SKILL.md                     # when to run, how to read results
  datasets/
    story-wall.golden.jsonl    # {input, memory_context, expected, rubric}
    job-match.golden.jsonl
    resume-bullets.golden.jsonl
    scraping.golden.jsonl
  graders/
    similarity.ts              # embedding/string similarity vs golden
    rubric.ts                  # criteria scoring (grounding, no-fabrication, tone)
    structured.ts              # field-level match for scraping
  runner.ts                    # load dataset -> call feature -> grade -> report
  report/                      # per-run scores, deltas vs last run
```
**Open items (for devs/product):** how to invoke each AI feature in isolation (API endpoint vs full workflow), what the memory-layer input contract looks like, and where to source the first 20–50 golden examples per feature.

## 5. Skill skeleton #2 — Guardrails Testing (safety/adversarial)

**Purpose:** prove the AI + memory layer don't fail in harmful ways under hostile or edge input. Highest-priority for a product handling career PII.

**Risk categories (all flagged in interview):**
1. **PII leakage** — resume data must never surface across users/sessions or land in logs/responses it shouldn't.
2. **Prompt injection** — malicious text embedded in uploaded resumes, job descriptions, **or the user-authored Story Wall input** hijacking the AI. The Story Wall is a first-class injection surface because it's free-form user-designed career-story text fed into generation.
3. **Fabrication / hallucination** — AI inventing job history, skills, credentials, or employers the user never entered.
4. **Cross-user memory bleed** — the memory layer serving user A's stored context to user B. This is the signature risk of a memory-layer architecture and deserves dedicated tests.

**Proposed skeleton:**
```
skills/vaultcv-guardrails/
  SKILL.md
  attacks/
    prompt-injection.jsonl     # payloads for resume/JD/story-wall fields
    pii-leakage.jsonl          # probes that try to extract other-user/system data
    fabrication.jsonl          # inputs where correct behavior = refuse/ground, not invent
    memory-bleed.jsonl         # multi-user scenarios: store as A, probe as B
  oracles/
    refusal-check.ts           # did the system refuse/neutralize the attack?
    pii-detector.ts            # scan output for PII patterns that shouldn't appear
    grounding-check.ts         # every claim traceable to real user input
  runner.ts
```
**Design note:** guardrail tests are pass/fail on *safety*, not quality — a failure is a security bug, filed via the existing bug-report format. Memory-bleed tests need a two-user harness (store context as user A, then query as user B and assert zero leakage).

## 6. Skill skeleton #3 — E2E + Functional (Playwright)

**Purpose:** verify the mechanical app works — auth, navigation, core journeys — on `app.vaultcv.com`.

**Priority flows:** login/signup (auth route group already visible), Story Wall create/edit, resume upload → enrichment, job add → match, and the account/vault dashboard.

**Proposed skeleton:**
```
skills/vaultcv-e2e/
  SKILL.md
  playwright.config.ts         # baseURL app.vaultcv.com, projects for browsers
  fixtures/
    auth.ts                    # storageState reuse to avoid re-login per test
  tests/
    auth.spec.ts
    story-wall.spec.ts
    resume-enrich.spec.ts
    job-match.spec.ts
  utils/
    test-users.ts
```
**Design note:** use Playwright `storageState` for auth reuse; add `@axe-core/playwright` for accessibility scans (cheap, high value). Gate E2E behind a health check for the Cloudflare tunnel — the 1033/530 issue would fail every test with a misleading cause, so the suite should detect "site down at edge" and report that distinctly from real test failures.

## 7. API + SQL testing — skeleton to pre-stage (DO NOT build yet)

Blocked on repo/API access. When it lands:
- Map Next.js route handlers (`app/api/...`) → build a **Schemathesis**-style (or TS equivalent like a typed fetch + zod-schema validation) contract/negative-testing layer.
- SQL/data validation: assert the memory layer persists and retrieves correctly at the storage level (complements the black-box memory-bleed guardrail tests).
- Pre-stage now: a `skills/vaultcv-api/` folder shape and a checklist of questions for devs (auth scheme, endpoint inventory, request/response schemas, DB access for validation, test-tenant availability).

## 8. A/B testing workflow — brainstorm (axes undecided)

You'll decide comparison axes with product/devs. The framework is the same regardless: A/B testing here is **eval harness run twice over the same golden dataset with two variants, then compared.**

Your stated interest: how much the **memory-layer output matters for each Story Wall creation and resume-bullet tailoring** — i.e. does richer/different memory context measurably improve output quality? That's exactly an A/B eval: variant A (current memory context) vs variant B (alternative context/prompt/model) scored on the same golden set, reporting quality delta + cost delta.

**Proposed skeleton (reuses eval harness):**
```
skills/vaultcv-ab/
  SKILL.md
  variants/
    a.config.ts                # prompt/model/memory-context A
    b.config.ts                # variant B
  compare.ts                   # run eval harness on both, diff scores + cost
  report/                      # winner, per-metric delta, significance note
```
**Design note:** for a no-budget startup, the decisive metric is usually **quality-per-dollar** — track token cost per variant alongside quality score so "good enough + cheaper" can win. Keep sample sizes honest (small golden sets → report deltas as directional, not statistically significant, until the set grows).

## 9. Autonomy & cost model

- **Now:** GitHub Actions (free tier: 2,000 min/month private repos). Run E2E + evals as a PR gate and nightly regression.
- **Cost-sensitive design (startup, no budget):**
  - Evals/guardrails call LLMs → the real cost is model tokens, not CI minutes. Cap golden-set sizes early; expand as value is proven.
  - Prefer OSS graders (embedding similarity, regex/pattern PII detection) over paid eval platforms.
  - The OpenAI Evals *platform* referenced in `knowledge-base/07_openai_evals_reference.md` is being deprecated and is OpenAI-specific — use it as **method**, not tooling. Build the harness Claude-native/self-hosted.
  - LLM-judge grading is the expensive part; since your oracle is a human-labeled golden set, lean on cheap deterministic similarity where possible and reserve model-judging for the genuinely open-ended fields.
- **Later:** sync with devs/product on whether GH Actions stays or moves to a cheaper/free runner; decide scheduled-run cadence by how often prompts/workflows actually change.

## 10. Sequenced next steps (once access lands)

1. Stand up the golden-dataset structure and collect the first 20–50 labeled examples per AI feature — nothing else works without this.
2. Build the eval harness runner + similarity/rubric graders (TS).
3. Build guardrails, starting with cross-user memory-bleed and Story-Wall prompt injection (highest, most product-specific risk).
4. Build Playwright E2E with a Cloudflare-health gate.
5. Pre-stage the API skeleton; fill it in when endpoints are documented.
6. Wire evals + E2E into GH Actions as a PR gate + nightly run.
7. Layer A/B on top of the eval harness once product picks the first comparison (likely memory-context impact on Story Wall / resume bullets).

## 11. Open questions to take to devs/product

- How is each AI feature invoked in isolation (dedicated endpoint vs full workflow only)?
- What does the memory-layer input/output contract look like, and can it be seeded/reset for tests (test tenant)?
- Auth scheme for automated test users (the login uses email/password; is there a test-account or token path)?
- Endpoint inventory + request/response schemas for the API layer.
- DB/storage access for direct memory-persistence validation.
- Where do the first golden examples come from — existing good outputs, or hand-authored?
- First A/B question product actually cares about (to shape the compare harness).
