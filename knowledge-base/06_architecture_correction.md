# Architecture Correction — VaultCV

Files 02–04 in this knowledge base were produced by reasoning from the public `vaultcv/vaultcv.github.io` GitHub repo, live-site HAR captures, and screenshots. That evidence pointed to a Cloudflare-fronted React/Vite SPA with a separate backend.

**Correction (source: Krishna, 2026-06-29):** VaultCV is actually a memory-layer system built on Claude workflows. The GitHub-repo/Azure-backend framing in the earlier chats does not describe the real architecture and must not be used as the basis for new test design.

## What this changes for QA

- Standard web QA (Cloudflare/DNS/SSL, UI rendering, accessibility, performance via Chrome DevTools, GitHub Actions CI) is still valid and still needed.
- New QA surface area specific to a memory-layer/Claude-workflow product:
  - **Memory correctness** — does stored context persist accurately across sessions/turns, and is it retrieved correctly when needed?
  - **Workflow correctness** — do multi-step Claude workflows execute in the right order, handle failures/retries correctly, and produce deterministic-enough outputs for the same inputs?
  - **Output quality/accuracy** — since outputs are AI-generated, correctness can't always be checked with exact-match assertions; needs rubric- or model-graded evaluation (see `07_openai_evals_reference.md`).
  - **Regression on prompt/workflow changes** — any change to prompts, memory schema, or workflow steps needs a repeatable eval suite to catch silent quality regressions, not just functional breakage.
- Known open issues from the prior investigation (Cloudflare Tunnel Error 1033/530, job-scraping failures against JS-rendered pages, UI corruption in the job-description field) remain real and open — they are infrastructure/UI defects, independent of this architecture correction, and still block live-site testing until resolved.

## Action

Before trusting any test plan or automation framework decision drafted in files 02–04, re-validate it against the actual memory-layer/Claude-workflow architecture. Treat those files as defect/discovery history, not as current architecture truth.
