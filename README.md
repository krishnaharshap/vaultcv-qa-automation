# VaultCV QA

Dedicated QA / test-automation workspace for the VaultCV product launch. Intended to become a standalone repo under the **`vaultcv` GitHub org** (https://github.com/vaultcv).

## Test targets

- **`https://app.vaultcv.com`** — the customer product (Next.js App Router + React/TypeScript, Cloudflare-fronted). Primary QA target.
- **`https://vaultcv.com`** — marketing/landing page (modern, Cloudflare-fronted; on the **same Cloudflare infra** as the app). In scope for uptime + unified infra health.

VaultCV is a memory-layer system built on Claude workflows. QA covers standard E2E/API/SQL/non-functional testing **plus** AI-specific concerns: output-quality evals, safety guardrails, and memory/workflow correctness. See `QA_CHARTER.md` and `research/08_autonomous_test_automation_design.md`.

## Layout

```
VaultCV-QA/
  QA_CHARTER.md                     scope, rules, known issues
  README.md                         this file
  knowledge-base/                   exported ChatGPT history + corrections + scope decisions
    01_custom_instructions.md       [partially deprecated — history]
    02..04_chat_*.md                exported chats [banners note what's stale]
    05_cowork_project_setup_guide.md
    06_architecture_correction.md   memory-layer / Claude-workflow correction
    07_openai_evals_reference.md    eval-driven testing method reference
    09_scope_and_deprecations.md    authoritative in/out-of-scope decisions
  research/
    08_autonomous_test_automation_design.md   skill skeletons (design only)
  test-plans/  bug-reports/  automation/{playwright,api-contracts}/  reports/
```

## Stack (for consistency with the app)

Automation targets **TypeScript** (matches the Next.js/TS app; Playwright-native). See the design doc for the eval-harness, guardrails, and E2E skeletons.

## Git / pushing to the vaultcv org

This folder currently lives inside a Cowork-synced directory. Running `git` **inside the synced mount is unreliable** (the sync layer blocks the file-unlink operations git needs for its temp objects). Recommended workflow:

1. On your local machine (where this folder lives natively, outside any sync restriction), run:
   ```
   cd VaultCV-QA
   git init
   git add -A
   git commit -m "Initial VaultCV QA workspace: scope, exported history, automation design"
   git branch -M main
   git remote add origin https://github.com/vaultcv/<repo-name>.git
   git push -u origin main
   ```
2. Create the empty target repo in the `vaultcv` org first (or use `gh repo create vaultcv/<repo-name>`).

A `.gitignore` is included for the future TypeScript automation code (node_modules, Playwright artifacts, env files).

> Note: writing/editing files here works fine — only git's internal operations are affected by the sync mount. Nothing is blocking you from building out the workspace.
