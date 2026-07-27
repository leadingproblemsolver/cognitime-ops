# Deployment

## Recommended first deployment

```text
GitHub Pages
```

Reason: the app is static, local-first, credential-free, and does not need a server runtime.

## Steps

1. Push this repository with `.github/workflows/ci.yml` and `.github/workflows/deploy-pages.yml` at repository root.
2. Open GitHub repository settings.
3. Go to `Settings → Pages`.
4. Set source to `GitHub Actions`.
5. Push to `main` or run `deploy-pages` manually.
6. Confirm the live URL loads and the primary workflow completes.

## Portable hosting alternatives

Any static host works:

```text
GitHub Pages
Netlify static deploy
Vercel static deploy
Cloudflare Pages
plain Nginx or Caddy static directory
```

No environment variables are required.

## Verification after deploy

```text
[ ] homepage loads
[ ] generate sample execution map
[ ] export Markdown
[ ] export JSON
[ ] export CSV
[ ] export ICS
[ ] reload page and confirm local state behavior
[ ] clear local workspace
[ ] browser console has no runtime errors
[ ] no secrets appear in page source
```

## Rollback

Revert the faulty commit and push. GitHub Pages redeploys the previous static build.
