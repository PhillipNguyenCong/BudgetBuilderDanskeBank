# Native visual refresh — 11 November 2026

Presentation slice of US-03, US-04 and US-13; financial behaviour and acceptance criteria remain unchanged. The user requested an Apple-inspired app design with substantial inspiration from the new MobilePay look.

## Acceptance criteria

- Apply a consistent light native visual system to the shell, reusable controls, account choices, editable pots and saved-plan cards.
- Use platform system typography, generous spacing, blue primary actions, rounded tinted tiles and labelled navigation icons with an explicit selected state.
- Keep account selection, manual creation, sample preview, saved-plan overview and existing loading/error/uncertainty states available.
- Preserve DKK values, planning terminology, virtual-allocation explanations and all financial calculations.
- Preserve scalable text, safe-area handling, control labels and minimum 44-point touch targets. Verify physical-device layout separately.

## Design decision

The former navy banner and Open Sans presentation are replaced with a continuous light canvas, compact Danske Bank wordmark, a Demo badge, platform system fonts, 24-point tile corners and capsule actions. Budget introduction uses one prominent spending tile and two supporting tiles that wrap on narrow screens. The bottom navigation uses authored native geometric icons, selected tint and weight, and retains screen-reader tab state.

Reference: [MobilePay's August 2026 redesign announcement](https://mobilepay.dk/news/mobilepay-far-nyt-design). Its simpler tile-based home is inspiration; no MobilePay logos, assets or payment capabilities are added. This design is an implementation choice, not validated usability evidence.

## Verification

- Shared contracts and budget-core builds: passed.
- Mobile TypeScript and repository formatting: passed.
- iOS and Android exports: passed.
- Native component suite: 39 passed, 10 failed; failures concern existing fixed-expense row labels and tests expecting an initial bill row. An isolated copy of the unchanged HEAD source produced the same 4 failed suites / 10 failed tests / 39 passed tests, confirming these failures predate the visual refresh.
- Physical-device visual review, large-text layout, VoiceOver/TalkBack and keyboard testing remain pending. This host has no iOS simulator; exports and component checks do not establish visual quality on a device.
