# Native widget editor — US-04 / US-13 partial slice

As a customer, I can review and adjust an allocation draft using expandable widgets before accepting any changes.

Scope: the reusable editor and an explicitly labelled, offline sample preview. This slice does not enable account-selection Continue, generate suggestions, save budgets or complete US-03/04/13. Preview data is independently authored synthetic data, not derived from the selected account.

## Acceptance criteria

1. Four full-width widgets start collapsed: Monthly salary, Spending budget, Fixed expenses and Savings. Expanding reveals inline labels, whole-DKK amount inputs and read-only totals (US-04 AC-3–5).
2. Rename widgets, edit/add/remove rows, add named pots with a chosen type, and select the six contract colors. Existing types cannot be changed. Repeated additions are supported within contract safety limits (US-04 AC-6).
3. Blank/negative/fractional/unsafe inputs are invalid, not zero. Names and labels must be nonblank. Show exact income, allocation and unallocated amounts using budget-core. Over-allocation shows the shortfall and preserves input; positive unallocated money is valid (US-04 AC-7, US-10).
4. Changes never automatically redistribute savings. Update savings requires selecting a savings row, shows its before/after amount and pot total, and changes only that row after confirmation. Cancel preserves the draft. An impossible negative target is explained (US-04 AC-9).
5. Original source explanation/period remain visible after an edit; show “Adjusted by you”. Draft provenance is retained locally. No preview edits are persisted (US-04 AC-4/11).
6. Controls have accessible names, expansion/selection states, text-based errors and generous touch targets. Inline rows wrap at narrow widths or large font sizes. The keyboard must not obscure the form (NFR-02).
7. The preview is reachable from Budget, makes its sample/non-saving status explicit, and offers confirmed discard when leaving an edited draft. Account selection remains unchanged.

## Decisions and subsequent integration

- The explicit savings review assigns the unallocated amount (positive or negative) to one customer-selected existing savings row. It preserves every other row/pot and never chooses a funding priority. Add a savings row first if none exists. This is ordinary allocation editing, not US-14 goal recommendations.
- The draft retains raw input text separately from validated contract data. Legacy fractional-øre values are preserved unchanged until explicitly replaced with a whole-DKK amount; opening a saved plan must never round it silently.
- Before save integration, extend row provenance with an optional original suggested label/amount and explicit user-adjustment marker; retain source explanation, period and record references. Existing plans must remain readable. The preview's draft metadata alone is not persistent provenance.
- Before US-13 integration, reject type changes for existing pot IDs at the backend boundary as well as in the editor. Add revision-conflict and save/reopen tests.
- US-11 rollover controls, live suggestions, irregular-bill schedules, persistence/overview routing and historical effective dates remain subsequent slices. Existing rollover values are preserved by the editor.

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
