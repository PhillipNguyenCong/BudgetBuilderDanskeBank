# Mobile feature organisation maintenance

Status: implemented and automatically verified on 10 November 2026. Physical-device visual/accessibility verification remains pending.

## Story and acceptance criteria

As a developer, I can find each mobile workflow in its own feature folder and understand screens through small named components, without changing the existing customer experience.

This maintenance work supports the implemented slices of US-03 (account-backed creation), US-04 (allocation input), US-11 (saved rollover preferences) and US-13 (shared editor). It does not complete deferred saved-plan editing, AI, forecasting or rollover execution, or change their acceptance criteria.

- Separate account selection, creation, editor, overview, preview, shared budget modules and shell; expose narrow public entry points and avoid cross-feature private imports and dependency cycles.
- Keep request state and cancellation in owning hooks. Preserve injected service interfaces, route callbacks, draft lifetime and navigation/discard guards.
- Compose widgets, bill lists, frequency choices, source explanations, colour choices, rollover settings, save recovery and saved-plan cards from individual component files. Keep styles and prop types beside the component.
- Preserve blank-versus-zero handling, integer-oere calculations, explicit savings confirmation, source evidence, unavailable forecasts, save locking and uncertain-outcome recovery.
- Preserve visual styles, labels, modal focus references, keyboard handling, large-text conditions and live announcements. Foundation remains domain-agnostic.
- Keep API payloads and backend behaviour unchanged. Saved overview consumes contract data directly instead of constructing an editable draft.

## Verification

- Shared contracts and budget-core builds passed; the API test also built the backend.
- Mobile Jest suite: 13 suites, 42 tests passed. Existing coverage exercises eligibility, manual save/recovery, bill frequencies, savings review, rollover validation, overlays and discard navigation. An additional regression verifies parent rerenders retain draft edits and review state, edits clear review feedback, and an intentional key change starts a fresh draft.
- Mobile API integration: 1 test passed against an isolated synthetic loopback server. Sandbox permission was needed to bind the test server; no shared database was used.
- Mobile TypeScript and repository formatting checks passed.
- iOS and Android JavaScript/assets exports passed using the existing local Node 24.22.2 runtime. The default host Node 24.2.0 is below the documented mobile minimum.
- Static import audit covered 91 production modules: all relative imports resolve, feature public boundaries are respected, and no module dependency cycles were found. Routes import public feature exports.
- Documentation links and removal of obsolete native feature paths checked separately.

No simulator runtime (`xcrun simctl`) or Android `adb` is available on this host, so no native visual comparison or physical-device test was performed. Bundling and component tests do not establish visual parity, VoiceOver/TalkBack behaviour, usability or forecast accuracy. The device checklist in the [mobile README](../apps/mobile/README.md#device-verification-checklist--pending) remains applicable.

## Ownership and public interfaces

The [mobile README](../apps/mobile/README.md#structure) lists feature responsibilities; [Architecture](../Architecture.md#mobile-feature-boundaries--10-november-2026) defines dependencies. Feature `index.ts` exports serve UI consumers. Account-selection and budget-creation also provide explicit `api.ts` entry points so setup orchestration and the Node API test do not import React Native. Tests may mock concrete modules; production code must use the public feature interfaces.
