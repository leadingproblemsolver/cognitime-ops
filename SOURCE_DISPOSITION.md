# Source Disposition

## Uploaded artifact

- File: `cognitime-ops-main (2).zip`
- SHA-256: `4ebf87997b4fae6af58f140a590dc85929af250c832b18263b87c0deef60a1ee`
- Finalized at: `2026-07-27T17:35:00Z`

## Initial state

The uploaded README identified the project as early-stage / halfway done and described it as a TypeScript + Vite + Supabase starter with core features missing.

The uploaded code included a provider-dependent TanStack/Lovable/Supabase/OpenAI path, but the primary user-facing cognitive-time execution planner was not available as a deployable, credential-free product.

## Final treatment

The release was converted into a local-first static product:

- no Supabase requirement;
- no OpenAI/Gemini requirement;
- no login requirement;
- no payment requirement;
- deterministic cognitive-time planner implemented in code;
- browser-local workspace persistence;
- portable exports;
- GitHub Pages deployment workflow;
- tests and smoke validation.

## Rationale

This follows the portfolio non-negotiable: actual user workflow first. A user must be able to enter work context, obtain a useful output, and export it immediately before any cloud/provider integration is added.
