# Mobile shell verification — 9 November 2026

Scope: [mobile shell acceptance criteria](mobile-shell-story.md), a partial delivery of US-01/02. Tested in the BudgetBuilderDanskeBank worktree on macOS using Node 24.22.2 and npm 11.3.0. The host default Node 24.2.0 was not used for final checks because React Native requires at least 24.3 in the Node 24 line.

## Initial SDK 57 verification

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

## Initial SDK 57 limitations

- Physical iPhone/Android, VoiceOver/TalkBack, largest-text and landscape testing remain pending. No Xcode/Android simulator is installed. Bundling does not verify these behaviors. Follow the checklist in apps/mobile/README.md.
- `npm audit` reports 20 affected dependency entries: 9 low, 8 moderate and 3 high; no critical. The high entries are the Expo Router → query-string → decode-uri-component URL parsing chain (denial-of-service advisories GHSA-vcc3-ghjq-m6fr and GHSA-qr28-fpjm-wq7f). Moderate entries include Expo build tooling and the pre-existing Drizzle/esbuild toolchain; low entries include Jest/deepmerge. Counts include propagated parent-package findings, not 20 distinct flaws. No incompatible SDK upgrade or forced audit downgrade was applied. Resolve/reassess these before exposing the prototype to untrusted links or treating it as a release build.
- No authentication, API integration, budget creation, forecasts, AI or database integration is claimed by this delivery.

The dependency scan is not clean; the functional and compatibility checks above passed independently. No usability or forecast accuracy claims are made.


## SDK 58 compatibility fix — 9 November 2026

The physical iPhone reported Expo Go SDK 58 while the project targeted SDK 57. Upgraded the mobile workspace and root native dependency pins together to SDK 58, React 19.3 and React Native 0.88.1. Rebuilt the lockfile after incremental installation retained conflicting SDK 57 dependencies. Updated the custom tab bar to use the SDK 58 emitter/navigateToTab API, moved the initial tab setting to the route layout settings, and awaited the asynchronous router test helpers. This maintains mobile-shell US-01/02 acceptance criteria rather than adding a feature.

Verified with Node 24.22.2:

- Mobile navigation test passes, including cold launch, all four tabs and disabled creation.
- Expo Doctor passes 18/18 checks after aligning Jest 30 and React type definitions.
- iOS and Android Hermes exports pass with bundled local fonts.
- All workspace type checks, backend/shared build, 30 backend/shared tests, generated contract checks, formatting and diff whitespace checks pass. Backend HTTP tests required loopback access outside the sandbox.
- The final dependency installation reports 24 audit entries (1 low, 23 moderate, no high or critical); the dependency audit remains unresolved. This supersedes the initial SDK 57 counts above.

Physical-device launch and accessibility checks remain pending. Stop the old Metro process and restart with `npm run start --workspace @budget-builder/mobile -- --clear`, then scan its QR code using the SDK 58 Expo Go app. The missing Android SDK/ADB error applies to launching a local emulator and does not prevent QR-based Expo Go use on a phone. The pre-existing local tsconfig edit was preserved.
