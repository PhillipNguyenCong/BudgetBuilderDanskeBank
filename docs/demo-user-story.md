# Demo user data — backend delivery slice

Supports US-03 account ownership and US-10 data transparency.

As a prototype developer, I can read the current demo profile and its account data through one consistent API identity.

Acceptance criteria:
1. GET /api/v1/me returns the server-owned id, nullable trimmed displayName and isDemo.
2. Profile and normalized banking data share one cached source read. Missing/blank names are null.
3. Other identities cannot access the profile or banking data; request headers/query/body never select ownership.
4. Configured missing or invalid files produce a safe error, never fallback data or raw details.
5. The approved local file remains outside Git; memory remains the default and no database connection or frontend changes are introduced.
6. Synthetic tests, API examples and local endpoint verification distinguish raw counts from normalized records and report actual coverage.

## Verification

The supplied local file was exercised through the HTTP application with explicit memory storage: /me, /accounts, and the selected account's transaction/payment endpoints returned schema-valid responses. One profile with a known display name and one account were returned. There were 83 normalized transaction records and 14 payment records; these are not counts of unique purchases or executed payments. Coverage was 2026-07-01 through 2026-09-03, with two complete months. No raw response or personal identifiers were written into this report.

Automated tests use independent synthetic fixtures and temporary files, never the Downloads dataset. No database connection, migration or cloud upload was performed. The mobile app remains unchanged and does not consume the new endpoint yet.

Final checks passed: 34 backend/shared tests, all-workspace TypeScript checking, build, OpenAPI/example drift validation, formatting and whitespace checks. Review confirmed owner checks precede source loading, profiles are validated at the response boundary, cached objects cannot be mutated by callers, and the local `.env` remains ignored. No mobile files changed.
