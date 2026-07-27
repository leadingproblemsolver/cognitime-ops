# Security Boundary

## Current model

CogniTime Ops is a static browser application.

```text
No server
No login
No API token
No external provider request
No telemetry
No cloud database
```

## Storage

Plans and ledger entries are stored in browser `localStorage` under:

```text
cognitime.ops.v1
```

Users can delete local state through the app's `Clear local data` control or browser storage settings.

## Data sensitivity

Users should avoid entering secrets, private credentials, medical details, personal data, or confidential company material into any public demo environment. Although the app does not transmit data, browser storage is not an encrypted vault.

## CSV safety

CSV exports neutralize formula-like values beginning with:

```text
= + - @ tab carriage-return
```

This reduces spreadsheet formula-injection risk when opening exported CSV files.

## Future server warning

If future versions add a backend, authentication, sync, or AI calls, the release must add:

```text
explicit auth boundary
token handling
server-side secret storage
CORS policy
rate limiting
data deletion path
provider disclosure
retention policy
```

Do not place provider keys in frontend JavaScript.
