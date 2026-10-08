# Web application

Status: directory scaffold; no runnable application yet.

The responsive React, TypeScript and Vite web application will support desktop and mobile browsers in one codebase.

- Own web screens, navigation and presentation state.
- Communicate with `apps/backend` through its HTTP API.
- Use shared API contracts from `packages/contracts`.
- Never connect directly to Neon or contain database credentials.

Native mobile screens belong in `apps/mobile`. Build and test commands will be documented when the application is initialised.
