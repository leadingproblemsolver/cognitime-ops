# Release Checklist

## Repository gate

- [x] Product identity matches code, README, and package metadata.
- [x] Core workflow is executable without external credentials.
- [x] Static build exists.
- [x] CI workflow exists.
- [x] GitHub Pages workflow exists.
- [x] Tests exist for domain logic and export paths.
- [x] Security boundary documented.
- [x] Code contract exists.

## Deployment gate

- [ ] Push repository to GitHub with workflows at repository root.
- [ ] Set `Settings → Pages → Source → GitHub Actions`.
- [ ] Confirm `ci` passes.
- [ ] Confirm `deploy-pages` passes.
- [ ] Open live Pages URL.
- [ ] Generate plan from sample data.
- [ ] Export Markdown, JSON, CSV, and ICS.
- [ ] Confirm no secrets in page source.

## User validation gate

- [ ] One cold user completes primary workflow without explanation.
- [ ] Time to first useful output recorded.
- [ ] First confusion recorded.
- [ ] One improvement made from observed friction.
- [ ] Results captured in `LIVE_VALIDATION.md`.
