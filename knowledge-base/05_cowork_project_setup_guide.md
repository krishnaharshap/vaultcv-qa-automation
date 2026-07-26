# VaultCV QA — Cowork Project Setup Guide

Cowork has no separate "Projects" feature like ChatGPT. A project here is: one connected folder + the skills/connectors enabled + reference docs and a charter file inside that folder. "Setting up a project" means setting up that folder correctly, once, so every future session points at the same persistent context.

Important correction carried into this guide: the ChatGPT export (files 01–04) reasoned about VaultCV as a Cloudflare-fronted React/Vite SPA with a separate Azure backend, based on the public GitHub repo and HAR evidence. You've now clarified VaultCV is actually **a memory-layer system built on Claude workflows**. That's a material architecture correction — QA must now also cover memory/context persistence and workflow correctness, not just conventional web QA. Treat the old chats as defect/infrastructure history (the Cloudflare tunnel issue, job-scraping failures, UI bugs are still real and still open), not as the architecture model going forward.

---

## 1. Connect a dedicated folder

Connect (or create) a folder, e.g. `VaultCV-QA/`. This becomes the project's home — knowledge base, test plans, automation code, and bug reports all live here so they persist across sessions instead of evaporating at the end of a chat.

## 2. Seed the knowledge base

Move these into `VaultCV-QA/knowledge-base/` (already produced in this session):
- `01_custom_instructions.md`
- `02_chat_vaultcv_qa_strategy_setup.md`
- `03_chat_cloudflare_error_1033_analysis.md`
- `04_chat_qa_architecture_brainstorming.md`

Add a new file, `05_architecture_correction.md`, stating plainly: VaultCV is a memory-layer system built on Claude workflows, this supersedes the GitHub-repo/Azure-backend assumption in files 02–04, and any test design pulled from those files must be re-validated against the real architecture before being trusted.

## 3. Write a project charter (replaces ChatGPT's "custom instructions")

Cowork has no persistent custom-instructions field. The equivalent is a `QA_CHARTER.md` in the folder root (or a `CLAUDE.md` if you connect the actual repo and run the `init` skill). It should state:

- **Scope:** VaultCV only, QA/testing/automation/bug-analysis only.
- **Architecture ground truth:** production at https://vaultcv.com/ (Cloudflare-fronted), built as a memory-layer system on Claude workflows. Test design must account for memory/context persistence, workflow execution correctness, and AI output accuracy — in addition to standard E2E/API/SQL/non-functional QA.
- **Known open issues:** Cloudflare Tunnel Error 1033/530 (tunnel health — blocks all live-site testing until resolved), job-scraping failures against JS-rendered pages, UI corruption in the job-description field.
- **Output rules:** concise, evidence-based, no filler, no emojis; structured bug-report and test-case formats (carried over from `01_custom_instructions.md`).

## 4. Folder structure

```
VaultCV-QA/
  QA_CHARTER.md
  knowledge-base/        (the 4 exported chats + architecture correction note)
  test-plans/
  bug-reports/
  automation/
    playwright/
    api-contracts/
  research/
  reports/                (status digests, deploy checklists)
```

## 5. Skills to use, mapped to QA activities

- `engineering:testing-strategy` — build the formal test strategy/test plan once the memory-layer architecture is documented.
- `engineering:architecture` — turn the tooling discussion already drafted (Playwright + Schemathesis + k6 + ZAP) into a real ADR, re-validated against the corrected architecture.
- `engineering:code-review` — review automation framework PRs once code lands.
- `engineering:debug` — structured RCA for issues like the Cloudflare 1033 tunnel error.
- `engineering:incident-response` — for production blockers (e.g. the tunnel outage).
- `engineering:deploy-checklist` — go/no-go checklist ahead of the VaultCV launch.
- `engineering:documentation` — runbooks and onboarding docs for the automation framework.
- `init` — if you connect the real VaultCV repo, this generates a `CLAUDE.md` from the actual codebase instead of from chat-reconstructed assumptions.

## 6. Connectors worth adding

- GitHub, pointed at the actual VaultCV/memory-layer repo — lets QA work read real code instead of relying on screenshots and HAR exports.
- Any uptime/monitoring tool already in use for Cloudflare, if one exists — say so and I can check the connector registry.

## 7. Recurring automation worth setting up

- A daily scheduled check against https://vaultcv.com/ to catch tunnel/530 regressions before they become launch blockers.
- A weekly QA status digest: test-plan progress, open bugs, automation coverage.

## 8. First real working session, in order

1. Document the corrected architecture (memory layer + Claude workflows) as the new ground truth — this must happen before any test plan is trusted.
2. Re-run `engineering:testing-strategy` against the corrected architecture.
3. Resolve or at least formally track the Cloudflare tunnel issue — it blocks all live-site testing.
4. Scaffold the Playwright + API testing framework already recommended in the brainstorming chat, adjusted for memory/workflow testing needs.
