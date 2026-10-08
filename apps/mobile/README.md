# Native mobile application

Status: reserved for a later phase; no React Native application has been initialised.

This directory will contain a React Native application using the same backend as the web application. Mobile-browser support is delivered first by the responsive application in `apps/web`.

- Build native screens and navigation here.
- Reuse API contracts from `packages/contracts`.
- Access data through `apps/backend`, never directly through Neon.
- Keep authoritative budget calculations on the backend.

The initial native scope should reuse the completed budget-creation flow. Shared logic does not imply that web UI components can be reused unchanged.
