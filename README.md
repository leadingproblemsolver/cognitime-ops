# CogniTime Ops

Local-first cognitive-time execution planner for operators who need to turn an ambiguous goal into a leverage-ordered work map, track session quality, and export the result without creating a cloud account.

## One-line utility

Enter a goal and work items → receive a cognitive-time execution map → export Markdown, JSON, CSV, ICS, or the full local workspace.

## Primary user

Founder, engineer, operator, or researcher deciding what to do next when work has mixed leverage, cognitive density, blockers, and overhead.

## Primary workflow

```text
goal + success metric + constraints + line-based work items
→ deterministic classification into leveraged / high-density / low-density / latent phases
→ cognitive-time metrics: CDS, LTR, LTF, total minutes, blocked minutes
→ exportable execution plan and session ledger
```

## What this version does

- Runs entirely in the browser.
- Requires no login, Supabase, OpenAI, Gemini, payment system, or server.
- Persists plans and ledger events in browser `localStorage`.
- Builds static files into `dist/` for GitHub Pages, Netlify, Vercel static hosting, or any plain web server.
- Provides deterministic domain logic in `src/domain/cognitime.js` with Node tests.
- Exports Markdown, JSON, CSV, ICS, and full workspace JSON.
- Neutralizes spreadsheet formula-like cells in CSV exports.

## What this version does not claim

- It does not prove productivity gain, ROI, demand, adoption, or time savings.
- It is not a clinical cognitive assessment tool.
- It does not automatically integrate with calendars, Notion, Supabase, or AI providers.
- It does not sync across devices unless the user manually exports/imports the workspace.

## Quick start

```bash
npm ci
npm run validate
npm run dev
```

Open the local URL printed by `npm run dev`.

## Build

```bash
npm run build
```

Static output is written to:

```text
dist/
```

## Work item input format

One work item per line:

```text
title | type | minutes | leverage 1-5 | urgency 1-5 | confidence 1-5 | dependency
```

Accepted types:

```text
leveraged
high_density
low_density
latent
```

Example:

```text
Define success metric | leveraged | 35 | 5 | 5 | 4
Draft first user-facing artifact | high_density | 90 | 4 | 5 | 4
Clean duplicated notes | low_density | 40 | 1 | 2 | 5
Wait for unclear stakeholder approval | latent | 30 | 1 | 3 | 2 | missing owner
```

## Metrics

| Metric | Meaning |
|---|---|
| CDS | Cognitive Density Score: weighted density across planned or logged minutes. |
| LTR | Latent Time Ratio: percentage of minutes blocked, unclear, waiting, or dependency-bound. |
| LTF | Leverage Transfer Factor: weighted leverage across planned or logged minutes. |
| RCI | Re-ramp Cost Index: average re-ramp minutes per context switch in the session ledger. |

## Repository structure

```text
.github/workflows/        CI and GitHub Pages deployment
src/domain/cognitime.js   deterministic planner, exports, and ledger metrics
src/app.js                browser controller and localStorage workspace
src/styles.css            standalone UI styles
scripts/                  build, smoke, and local static server
tests/                    Node test suite
docs/                     deployment, security, integration, and claim boundaries
evidence/                 human ownership gates and live-validation template
examples/                 sample workspace artifact
```

## Validation

```bash
npm run validate
```

Validation performs:

```text
node --test tests/*.test.mjs
→ static build
→ build artifact smoke test
→ export-path smoke test
```

## Deployment

Use GitHub Pages first:

```text
Settings → Pages → Source → GitHub Actions
```

The included workflow:

```text
.github/workflows/deploy-pages.yml
```

runs `npm ci`, `npm run validate`, uploads `dist/`, and deploys it to Pages.

## Claim boundary

This repository is an offline-verified, local-first release candidate. It is ready for live user validation, but live adoption, repeat use, production reliability, and measurable productivity gains remain unproven until recorded in `LIVE_VALIDATION.md`.
