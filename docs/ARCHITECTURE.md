# Architecture

## Final architecture

```text
index.html
→ src/app.js
→ src/domain/cognitime.js
→ browser localStorage
→ user-triggered exports
```

## Design choice

The uploaded source was a Supabase/OpenAI/TanStack/Lovable starter whose README explicitly stated the core features were not implemented. The final release converts the product into a deterministic local-first static application so that actual users can complete the primary workflow immediately without vendor setup.

## Core modules

### `src/domain/cognitime.js`

Pure deterministic logic:

- input normalization
- work item classification
- cognitive-time scoring
- phase construction
- metric calculation
- Markdown/CSV/ICS export
- session-ledger rollup

### `src/app.js`

Browser integration:

- form handling
- rendering
- localStorage persistence
- workspace import/export
- download triggers

### `scripts/`

Release mechanics:

- `build.mjs`: copies static app into `dist/`
- `smoke.mjs`: verifies static build and export pathways
- `serve.mjs`: local loopback-only static development server

## Why no Supabase/OpenAI in v1

The fastest path to usable value is the input → deterministic plan → export loop. Provider-backed sync or AI generation would increase dependency, credential, privacy, and failure surface before the core workflow has cold-user validation.
