# Shared API contracts

Status: directory scaffold; no package or validation library has been initialised.

Shared TypeScript request and response types, error formats and runtime validation schemas belong here. These contracts connect `apps/web`, `apps/backend` and the future `apps/mobile`.

Keep this package independent of database drivers, server credentials and UI frameworks. Database entities are not automatically public API responses. Client-side validation improves feedback; the backend must still validate requests and enforce access.
