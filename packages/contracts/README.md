# Shared API contracts

Status: directory scaffold; no package or validation library has been initialised.

Shared TypeScript request and response types, error formats and runtime validation schemas belong here. These contracts connect `apps/web`, `apps/backend` and the future `apps/mobile`.

Planned contracts must represent one account per budget, named typed subaccounts, salary allocations, optional transaction assignment, saved rollover choices and their savings targets, monthly history and separate forecast results. The [domain model](../../domain-model-notes.md) omits IDs and metadata for readability; API contracts must still define the identifiers and validation needed for safe operations.

Keep this package independent of database drivers, server credentials and UI frameworks. Database entities are not automatically public API responses. Client-side validation improves feedback; the backend must still validate requests and enforce access.
