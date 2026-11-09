# Mobile shell verification — 9 November 2026

Scope: [mobile shell acceptance criteria](mobile-shell-story.md), a partial delivery of US-01/02. Tested in the BudgetBuilderDanskeBank worktree on macOS using Node 24.22.2 and npm 11.3.0. The host default Node 24.2.0 was not used for final checks because React Native requires at least 24.3 in the Node 24 line.

## Passed

- Clean `npm ci` from the committed lockfile.
- `npm run test:mobile`: one integration test exercises the actual routes, cold-start redirect to Budget, all four tabs, selected accessibility state, demo headings, disabled Create budget and return navigation.
- `npm run typecheck`: all four workspaces, including native components and tests.
- `npm run check:mobile`: SDK dependency versions match.
- Expo Doctor: 18/18 checks, including native dependency deduplication.
- `npm run bundle:mobile:ios` and `npm run bundle:mobile:android`: Hermes JavaScript/assets export, with both local Open Sans files included.
- `npm test`: 30 backend/shared regression tests pass using memory storage.
- `npm run check:contracts`: no API contract/example drift.
- `npm run format:check` and `git diff --check`.

## Review

Routes contain composition only. Foundation has no feature imports, business state, API calls or calculations. No backend source or database setup changed. Native tests are outside the Expo route directory and are not discovered by the backend Node runner. App startup does not start the backend. Repository scripts, architecture and delivery priority now describe native-first delivery.

Source-level layout review checked safe-area handling, scrolling, minimum touch dimensions, unrestricted text scaling, automatic-height text/cards, header wrapping and text/underline selected states. Colors, typography and content were compared with Figma node 194:9. This is not a rendered-device visual or accessibility evaluation.

## Remaining limitations

- Physical iPhone/Android, VoiceOver/TalkBack, largest-text and landscape testing remain pending. No Xcode/Android simulator is installed. Bundling does not verify these behaviors. Follow the checklist in apps/mobile/README.md.
- `npm audit` reports 20 affected dependency entries: 9 low, 8 moderate and 3 high; no critical. The high entries are the Expo Router → query-string → decode-uri-component URL parsing chain (denial-of-service advisories GHSA-vcc3-ghjq-m6fr and GHSA-qr28-fpjm-wq7f). Moderate entries include Expo build tooling and the pre-existing Drizzle/esbuild toolchain; low entries include Jest/deepmerge. Counts include propagated parent-package findings, not 20 distinct flaws. No incompatible SDK upgrade or forced audit downgrade was applied. Resolve/reassess these before exposing the prototype to untrusted links or treating it as a release build.
- No authentication, API integration, budget creation, forecasts, AI or database integration is claimed by this delivery.

The dependency scan is not clean; the functional and compatibility checks above passed independently. No usability or forecast accuracy claims are made.
