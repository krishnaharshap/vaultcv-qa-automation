# VaultCV QA — Scope & Deprecations

Decisions recorded 2026-07-19 (source: Krishna). This is the authoritative scope reference. Where it conflicts with the exported chats (files 01–04), this document and the architecture correction (06) win.

## Verification of the ChatGPT export

All content from the original ChatGPT "VaultCV QA Automation" project is confirmed embedded in this project:
- Chat "VaultCV QA Strategy Setup" (shared id `6a2572bf-…`) → `knowledge-base/02_…` — fully captured, verified against the live shared link.
- Chat "QA Architecture Brainstorming" (shared id `6a256a12-…`) → `knowledge-base/04_…` — fully captured. Its two Deep-Research documents end mid-sentence **in ChatGPT's own source**, not due to export loss.
- Chat "Cloudflare Error 1033 Analysis" → `knowledge-base/03_…` — fully captured.
- Project custom instructions → `knowledge-base/01_…`.
- Project-level source files: none existed at the ChatGPT project level (in-chat attachments in chat 04 — .har/.jsonc/.docx — are named but their contents are not re-downloadable from ChatGPT).

Nothing from the ChatGPT project is missing.

## Current architecture truth (test target)

- **Customer product: `https://app.vaultcv.com` — a Next.js (App Router) + React/TypeScript app, Cloudflare-fronted.** This is the primary QA target.
- **Marketing/landing: `https://vaultcv.com` — a separate, modern, Cloudflare-fronted landing page.** In scope (see below). This is NOT the old static `vaultcv.github.io` site.
- Underlying design: memory-layer system built on Claude workflows (see `06_architecture_correction.md`).

## In scope

- **app.vaultcv.com** (Next.js customer UI) — primary. E2E/functional, API, AI evals, guardrails.
- **vaultcv.com** (landing page) — in scope. Kept because it is the public front door and a QA-owned asset.
- **Shared Cloudflare infra health** — verified finding: both domains emit `/cdn-cgi/rum`, i.e. they sit on the **same Cloudflare infrastructure**. Therefore custom-domain / Cloudflare / tunnel health checks are kept **unified** — one edge/tunnel health check covers both domains. The Cloudflare 1033/530 RCA (file 03) applies to both.
- Dedicated QA/testing code to live in its own repo, intended to be pushed to the **`vaultcv` GitHub org** (https://github.com/vaultcv). See `../README.md` for repo/push notes.

## Deprecated — removed from active testing scope (kept as history only)

1. **`vaultcv.github.io` as the main repository** — obsolete. The real app is a private Next.js repo.
2. **GitHub Pages deployment validation** — obsolete. The app is served via Cloudflare/Next.js, not GitHub Pages.
3. **"Static website / small static web project" framing** — obsolete. VaultCV is a dynamic authenticated app.
4. **Azure Functions backend assumption** — obsolete/unconfirmed; do not design tests around it.
5. **SEO / metadata checks** — dropped as a QA priority.
6. **Landing render / CTA / responsive-layout tests as core QA** — dropped as core scope (marketing-page concern). Basic uptime of vaultcv.com is still covered by the unified Cloudflare health check.

## Kept, but reframed

- **Custom domain / DNS / redirects** — not a standalone QA flow, but retained as part of the **unified Cloudflare infra health check** (justified by the shared-infra finding above).
- **Cloudflare Tunnel 1033/530 monitoring** — retained and elevated: it can take down either domain.

## Precedence

For any test plan or automation decision drawn from files 01–04, this document plus `06_architecture_correction.md` and `08_autonomous_test_automation_design.md` override the stale assumptions. The exported chats are retained for historical context only.
