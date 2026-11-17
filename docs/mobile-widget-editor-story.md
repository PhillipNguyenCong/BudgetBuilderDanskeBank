# Native widget editor — US-04 / US-13 partial slice

As a customer, I can review and adjust an allocation draft using expandable widgets before accepting any changes.

Scope: the reusable editor and an explicitly labelled, offline sample preview. This slice does not enable account-selection Continue, generate suggestions, save budgets or complete US-03/04/13. Preview data is independently authored synthetic data, not derived from the selected account.

## Acceptance criteria

1. Four full-width widgets start collapsed: Monthly salary, Spending budget, Fixed expenses and Savings. Expanding reveals inline labels, DKK amount inputs with up to two decimal places and read-only totals (US-04 AC-3–5).
2. Rename widgets, edit/add/remove rows, add named pots with a chosen type, and select the six contract colors. Existing types cannot be changed. Repeated additions are supported within contract safety limits (US-04 AC-6).
3. Blank amounts remain incomplete without an inline error and never become zero. Reject negative input, grouping separators and more than two decimal places while retaining the previous text; unsafe amounts remain invalid. Names and labels must be nonblank. Show exact income, allocation and unallocated amounts using budget-core. Over-allocation shows the shortfall and preserves input; positive unallocated money is valid (US-04 AC-7, US-10).
4. Changes never automatically redistribute savings. Update savings requires selecting a savings row, shows its before/after amount and pot total, and changes only that row after confirmation. Cancel preserves the draft. An impossible negative target is explained (US-04 AC-9).
5. Original source explanation/period remain visible after an edit; show “Adjusted by you”. Draft provenance is retained locally. No preview edits are persisted (US-04 AC-4/11).
6. Controls have accessible names, expansion/selection states, text-based errors and generous touch targets. Inline rows wrap at narrow widths or large font sizes. The keyboard must not obscure the form (NFR-02).
7. The preview is reachable from Budget, makes its sample/non-saving status explicit, and offers confirmed discard when leaving an edited draft. Account selection remains unchanged.

## Decisions and subsequent integration

- The explicit savings review assigns the unallocated amount (positive or negative) to one customer-selected existing savings row. It preserves every other row/pot and never chooses a funding priority. Add a savings row first if none exists. This is ordinary allocation editing, not US-14 goal recommendations.
- The draft retains raw input text separately from validated contract data. Existing exact øre values are preserved unchanged until explicitly edited; opening a saved plan must never round it silently.
- Before save integration, extend row provenance with an optional original suggested label/amount and explicit user-adjustment marker; retain source explanation, period and record references. Existing plans must remain readable. The preview's draft metadata alone is not persistent provenance.
- Before US-13 integration, reject type changes for existing pot IDs at the backend boundary as well as in the editor. Add revision-conflict and save/reopen tests.
- US-11 rollover controls, live suggestions, irregular-bill schedules, persistence/overview routing and historical effective dates remain subsequent slices. Existing rollover values are preserved by the editor.

Decimal-entry decision — 10 November 2026: accept comma or dot, allow clearing and a trailing separator during editing, and convert decimal text exactly to integer øre. This updates the original whole-DKK restriction for US-04/US-10.

## Verification

Passed: 20 native tests and 35 backend/shared tests, all-workspace TypeScript checking, formatting and contract-drift validation. Native coverage includes real-route preview/discard navigation, inline editing/expansion, repeated additions, color/name changes, blank versus zero, invalid/over-allocated input retention, original source explanations and savings apply/cancel. Exact-money tests include legacy fractional values and the maximum safe integer amount.

The sandbox initially blocked the backend HTTP tests from binding loopback; they passed when rerun with permission to bind local test servers. Tests use synthetic fixtures and the memory backend, with no database migration or deployment. Checks use the existing temporary Node 24.22.2 runtime because the host default Node 24.2.0 is below Expo's supported range.

iOS and Android Hermes exports passed with the final discard-navigation fix. Expo dependency checking passed against its bundled local map; network access was disabled, so this was not an online compatibility check. Relative documentation links and `git diff --check` passed. Device keyboard, screen-reader, modal focus and visual checks remain pending; automated tests and exports are not evidence of usability or physical-device verification.

## Subsequent delivery

[Manual creation](mobile-budget-creation-story.md) connects this editor to account selection, optional rollover preferences, accepted-plan saving and a saved overview. Optional persistent original-suggestion/adjustment metadata has been added. The sample preview remains offline and never saves; its original acceptance boundary is historical. Saved-plan editing and backend existing-type immutability remain future US-13 work.

## Revised widget layout — focused overlays

The latest user decision supersedes inline expansion in acceptance criteria 1, 2 and 6 above for manual creation and the sample preview (US-04, NFR-02). Each widget has two columns and three rows: type / overlay button; editable name / monthly amount; empty / budget-wide allocation guidance. Fixed expenses displays its derived bill total. Income, Spending and Savings expose one planning amount; existing multirow data is preserved rather than silently merged.

The top-right Edit bills button opens Fixed expenses; Settings opens other widget overlays. A shared full-screen shell inherits the widget colour and keeps its name, total, Close and Done controls outside the scrolling content. Fixed expenses contains compact name/amount bill rows, add/remove controls, allocation guidance and colour choices. Spending contains colour and rollover preferences. Savings and Income contain colour only. Renaming a single-row compact widget synchronises the row label. New pots start with a blank amount, never an implicit zero.

Edits update the local draft immediately. Done, Close and platform back retain changes; only the existing budget-save action persists them. The main list stays mounted and does not expand. Existing validation, exact arithmetic, savings review and saved-plan overview remain unchanged. No API or persistence schema changes are required.

Verification: 36 native tests and 41 backend/shared tests passed, along with all-workspace TypeScript, formatting and iOS/Android Hermes exports. Tests cover direct editing, type-specific overlays, Done/Close/platform-back retention, bill totals, colour persistence, rollover save validation, explicit savings review and the complete create/save navigation flow. Backend HTTP tests required permission to bind synthetic loopback servers. Native keyboard, screen-reader focus and scroll preservation still require device verification; exports are not device tests.

## Widget hierarchy and first bill entry

The refined presentation uses 14 px type/actions and allocation guidance around a 20 px semibold name/amount row. Top actions retain 44 px touch targets. Fixed-expense totals and Add bills share the amount input footprint; normal card spacing is consistent, while validation and accessibility text can increase height.

With no entered bill amounts, Fixed expenses shows Settings top-right and Add bills in the amount cell. Both open the existing overlay. Entered bill amounts, including explicit zero, show the total and Edit bills. Missing/invalid rows show Amount incomplete; nonblank invalid input remains reachable through Edit bills. Clearing all amounts or removing all bills restores Add bills. Detailed allocation explanations remain in the global summary and bill overlay; card guidance is compact. No calculations or persisted values change.

Hierarchy refinement verification: 37 native tests passed, including initial bill entry, explicit zero, incomplete/invalid rows, clearing/removal and reopening. Mobile TypeScript, repository formatting, diff whitespace checks and both native exports passed. Style review confirms scalable text and minimum rather than fixed field heights; normal/enlarged-text alignment still needs visual verification on a device.

## Clean widget surfaces and disclosure

Keep the two-column/three-row layout with 12 px corners, 16 px padding, transparent underlined inputs, 14 px supporting text and 20 px semibold primary values. Amounts and allocation status align right. Focus strengthens the underline without changing the draft. Both the fixed-expense amount surface (with chevron) and top-right action open the same overlay, including incomplete states.

The bill overlay pins the name, a separate Total per month block and Done around the scrolling Bills list, Add bill, allocation guidance and colour controls. Empty totals say No amounts entered; partial/invalid amounts remain incomplete. Create your budget moves explanatory paragraphs into a read-only More info modal beside its title. Account identity, labels, financial status, errors, monthly totals and explicit savings review remain visible. No API, data or calculation changes are introduced.

Clean-surface verification: 39 native tests passed, including clickable totals/incomplete amounts, More info dismissal with retained invalid input, and underline focus/error behaviour. Mobile TypeScript, repository formatting, whitespace checks and iOS/Android exports passed. Calculated minimum contrast across the six widget backgrounds is 9.76:1 for primary text and 4.75:1 for underlines. This does not establish device usability: simulator tooling (`simctl`) is unavailable, so long-name/large-amount layout, enlarged text, keyboard, focus restoration and scroll preservation remain device checks.

The Fixed expenses overlay now separates a tinted monthly-total card from a white bill-list surface. Shared Bill name / DKK per month column labels replace repeated labels at normal text sizes; larger text restores individual labels and stacks fields. Remove actions remain labelled and at least 44 px wide. Add bill sits inside the list, colour preferences sit in a separate section, and Done stays in a fixed footer. Suggested-source adjustment evidence remains visible; ordinary manual edits no longer add repetitive “Adjusted by you” text to every bill. All 39 native tests, mobile TypeScript and formatting pass. Visual device verification remains pending.

## Fixed-expense payment frequency

Each bill exposes Monthly, Quarterly, Every 6 months or Yearly inside its overlay, with Monthly as the default. The entered amount is DKK per payment; changing frequency retains that amount and displays its monthly equivalent. The fixed overlay total is labelled Set aside per month. Frequency choices are labelled radios, opened from an expanded-state button, and close on selection. Saved overview rows distinguish payment amount/frequency from monthly allocation.

The optional frequency contract field belongs only to fixed-expense rows; missing values preserve historical monthly behaviour. Budget-core divides payment oere by 1/3/6/12 with BigInt and rounds each bill up to the nearest oere. Draft guidance, totals, savings proposals and authoritative backend validation use the same monthly allocations. Blank/invalid values remain incomplete. More info explains rounding and that this is neither a payment schedule nor catch-up funding. Frequency and payment amount persist in existing plan JSON; no migration or deployment is required.

Frequency verification: 41 native tests and 46 backend/shared tests passed. Coverage includes equal monthly equivalents across all four frequencies, exact rounding, zero and overflow, legacy monthly totals, rejected frequency on non-fixed rows, live guidance, retained payment text, saved overview and backend save/reopen. All-workspace TypeScript, contract drift, formatting, whitespace checks and iOS/Android exports passed. No database migration was applied. Physical-device frequency-selector, keyboard and enlarged-text verification remains pending.

## Bill-entry focus flow — 10 November 2026

For US-04 and NFR-02, Add bill focuses the new row's name and reveals it in the scroll view. Name submission/Next focuses that same row's amount without dismissing the keyboard. Amount submission/OK clears focus and dismisses the keyboard while preserving the overlay and draft. Done closes the overlay only when no bill input is focused and the keyboard is hidden; header Close remains available. Removing an active row or dismissing the keyboard clears the active field. Existing validation and two-decimal entry remain unchanged.

## Simplified budget screens — 12 November 2026

The [budget simplification criteria](mobile-budget-simplification-story.md) supersede earlier add-pot controls and repeated per-widget allocation guidance. The editor keeps its initial widgets and preserves any multiple-pot input plan, but offers no add-pot action or replacement menu. Bill additions/removals remain available. A single global allocation guide and local incomplete-input messages replace repeated remainders. Monthly totals are collapsed; savings review remains explicit. Read more replaces More info in creation. These are UI changes only; shared money rules, contracts and persistence are unchanged.

## Restored per-widget guidance and simpler bills

The [latest setup refinement](mobile-setup-refinement-story.md) restores the same global remainder beneath each widget amount, removes the separate top guide, defaults unknown bill frequencies to Monthly and collapses source explanations. Non-monthly monthly equivalents remain visible; other payment amounts are not duplicated. Editable latest salary prefill applies only to account-backed creation. It does not change offline sample values. Native simulator findings and verification are recorded in that story.

## Amount input bubbles — 17 November 2026

For US-04 and NFR-02, single-amount Income, Spending and Savings fields use a white rounded bubble with the same blue outline and 14 px corners as Add bills. The bubble is an editable text input with decimal keyboard, existing labels, visible focus/error states and unchanged validation/blur updates. Names and bill-row inputs retain their underlines; the fixed-expense total remains a bill-editor action. Allocation guidance and latest-salary attribution remain beneath the amount.

Bubble refinement verification: 95 mobile tests, mobile TypeScript, targeted formatting and diff whitespace checks passed. An iPhone 17e / iOS 27.2 simulator screenshot confirmed that the editable salary bubble matches the adjacent Add bills outline and rounded shape while retaining the guidance below. No financial calculations, input parsing or persistence changed. Physical-device/VoiceOver verification remains separate.

## Minimal remainder labels — 17 November 2026

The latest user decision removes visible provisional, missing-entry and salary-source helper lines from the compact widgets. Below each amount, show only a short global remainder such as DKK 31,250 left or DKK 500 over. Hide the remainder until income can be calculated; do not substitute zero. Required-input validation, save blocking, over-allocation warnings and source explanations remain available in their existing fields, summary, overlays and Read more. Partial-input context stays in the compact label's accessibility hint. The bill overlay keeps its fuller allocation explanation. Calculations and draft persistence are unchanged.

Minimal-label verification: 95 native tests, mobile TypeScript, targeted formatting and diff whitespace checks passed. An iPhone 17e simulator screenshot confirmed one-line DKK 31,250 left labels below Income and Fixed expenses, with no salary-source or provisional helper lines and visibly shorter widgets. Input retention, exact allocation guidance, bill entry and save validation remain covered by existing behaviour tests.

## Fixed-expense total alignment — 17 November 2026

Filled bill totals use the same 20 px semibold scale as the editable amount bubbles. DKK / month sits above the bubble, leaving only the formatted numeric total inside; numeric totals stay on one line and can scale to fit. The bill editor action retains its chevron and full DKK value for accessibility. Add bills stays blue while entered totals use the normal amount text colour. This removes the wrapped currency/value stack that made the fixed-expense widget unusually tall.

### Compact widgets (US-04, NFR-02)

Remove Settings buttons and colour selection. Keep compact type labels, editable names, amount bubbles and a short remainder. Savings is green in the editor and saved overview. Bills remain reachable through their amount action; spending rollover preferences remain reachable through a Rollover link. Stored colours and multiple-pot support remain compatible. Large text may stack fields rather than truncate inputs.

### Compact setup header and Danish amount presentation (US-04, NFR-02)

Keep Back, Create budget and Read more in one compact header row. Keep the linked account and budget-name label, without an initial missing-name message; submission still validates the name. Display currency after amounts (`31.250 kr.`), with dot grouping and a comma decimal separator. Editable widget amounts show grouped values when idle and the unchanged ungrouped draft while focused. No calculation or persistence format changes.

### Fixed labels and aligned compact cards (US-04, NFR-02)

Editor widgets display fixed labels Income, Fixed expenses, Budget and Savings. Remove widget-name editing and the repeated type/name rows. Preserve stored names and rows, budget-name editing, bill-name editing and existing multiple pots. Use 16-point horizontal and 14-point vertical card padding, with name and amount columns vertically centred. Place the short remainder directly below the amount in its column. Stack columns for enlarged text.

### Icon-led nested columns (US-04, NFR-02)

Each editor card has an outer icon column and a flexible content column. The content contains a left-aligned label/action column and a right-aligned amount/remainder column. Category icons are decorative and hidden from screen readers. The amount column receives more width for currency values. At enlarged text sizes, content columns stack while retaining the leading icon. Existing amounts, validation and bill/rollover actions are preserved.

### Proportion review and deferred rollover (US-04, NFR-02)

Supersedes the earlier Rollover-link criteria: no rollover action or settings are shown in setup. Retain existing stored preferences and domain support. Card labels use 16/22 typography, amount figures 18/24 and secondary remainders 12/16. Cards use 14-point horizontal and 12-point vertical padding, with a 10-point icon/content gap. Currency suffix spacing grows with system text size to avoid overlapping the amount.

Verification: inspected the running iPhone 17 simulator at standard and accessibility-medium text sizes. Opened and closed the bill list, retaining the draft salary and bill total. Physical-device verification remains separate.

### Two rows per content column (US-04, NFR-02)

The icon remains in the outer leading column. Inside the flexible content area, the left column contains a title row and a muted `Per month` description row. The right column contains the amount field and the remainder. Align the first rows at 44 points minimum and the secondary rows with a 4-point gap and matching 12/16 typography. Keep the two-row columns separate so errors and longer amounts can grow without overlapping. At enlarged text sizes, stack the content columns. Rollover remains absent.

### Quiet amount editing (US-04, NFR-02)

Widget amounts use a transparent resting field with a subtle border only while focused. Empty fields display `Angiv beløb` and remain unknown; entered zero is still valid. Fixed-expense amounts and Add bills use a borderless action with a chevron. Keep 44-point touch targets, native text input, Danish amount formatting, validation and committed remainder updates. Other form fields retain their existing appearance.

### Tighter paired text rows (US-04, NFR-02)

Keep the 44-point amount touch area, but optically bring both secondary rows 8 points closer with no column gap. Leave full spacing after validation errors. Subtitles are Monthly salary, Monthly bills, Monthly budget and Monthly savings respectively. Financial calculations and draft labels remain unchanged.

### Setup as a form, saved plans as an overview (US-04, NFR-02)

Supersedes the quiet-field and per-widget-remainder layout: Income, Budget and Savings are edited directly in stable white fields with restrained borders. Fixed expenses retains its bill-list action. Remove negative spacing and show the shared remainder once after the four widgets; the bill overlay retains its own allocation guidance. Titles and monthly descriptions form a natural two-line group. Keep square icons, fixed labels, exact amounts, blank/zero distinction, blur commits and saved-plan overview behaviour. Rollover stays absent.

### Prominent remainder and keyboard confirmation (US-04, NFR-02)

Show the single allocation remainder in a distinct bordered summary with a visible Left to allocate label and 22-point amount. Negative remainders use Over-allocated and preserve the warning semantics. Missing amounts remain identified through accessible context. The screen shell shows an OK bar above the software keyboard; OK dismisses and blurs the active input, triggering its existing commit behaviour. Hide the bar after keyboard dismissal; bill overlays retain their existing keyboard controls.

### Allocation summary placement (US-04)

Place the single prominent Left to allocate summary immediately after Income, before Fixed expenses, Budget and Savings. Preserve its calculation, missing-data handling and over-allocation presentation.

### Unified setup header (US-04, NFR-02)

Use a plain Back arrow, a title/account subtitle group and a 44-point information action labelled Read more for accessibility. The account is secondary text under the title. Remove its separate row and reduce creation-screen top padding to 8 points. Keep branding, budget-name field and help popup focus restoration. Other screens keep their existing header padding and Back appearance.
