# Mobile shell — US-01 / US-02 delivery slice

As a customer, I can open the native prototype and navigate to Budget to understand its purpose.

This slice supports US-01 and US-02, NFR-02 and NFR-05. It does not complete their budget creation or saved-budget criteria.

## Acceptance criteria

1. Cold launch opens Budget. Home, Budget, Cards and More navigate and expose their selected state with accessible labels.
2. Budget presents the Figma introduction. Create budget is disabled and explained; pressing it creates nothing.
3. Other tabs identify themselves as demo screens without invented banking information.
4. Local Open Sans fonts, light bank colors, safe areas, scrolling, scalable text and controls at least 44 × 44 support both native platforms.
5. No business API, authentication, database or financial calculation is introduced.
6. Native tests run separately from backend Node tests. Type checking, Expo compatibility checks and both native JavaScript bundles pass.
7. Physical iPhone/Android, VoiceOver/TalkBack and large-text device checks are recorded separately from automated checks.

Design reference: https://www.figma.com/design/0ka6z9Ob7PgioGkZfnEN4V?node-id=194-9
