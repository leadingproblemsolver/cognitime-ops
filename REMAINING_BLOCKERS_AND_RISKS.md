# Remaining Blockers and Risks

## Not blocked

- Local use.
- Static hosting.
- Plan generation.
- Ledger rollup.
- Markdown/JSON/CSV/ICS exports.

## Evidence-gated

- No cold-user result has been recorded inside this release.
- No adoption, retention, ROI, productivity gain, or willingness-to-pay evidence exists.
- No accessibility audit beyond code-level static structure has been performed.
- No real project dataset has been used in production.

## Product risks

- Scoring weights are deterministic heuristics, not empirically validated productivity science.
- Browser `localStorage` is convenient but not encrypted or cross-device.
- Manual workspace import/export may be enough for validation but not for team use.
- ICS export creates calendar events but does not update a calendar through an API.

## Future escalation gates

Do not add AI, Supabase sync, account systems, billing, Notion, or calendar write integrations until the local-first workflow has evidence of repeated use or specific integration pull from a real user.
