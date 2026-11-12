# Live allocation guidance — US-04 / US-10

Show how much of entered income remains to allocate while the customer completes the manual plan. This is provisional arithmetic, not AI, a spending allowance or an account balance.

## Acceptance criteria

- A compact summary above the widgets and the same global remainder in each expanded pot update after the customer leaves an amount field. This avoids changing the guidance mid-entry. Income 17,000 DKK gives 17,000 left; spending 8,000 gives 9,000; savings 2,000 gives 7,000; fixed expenses 7,000 gives zero.
- All income rows must have valid amounts before showing a remainder. A nonblank invalid amount anywhere suspends guidance. Overflow is explicit.
- Blank pot amounts are excluded from the entered allocation total, remain incomplete, and retain save-blocking validation. Label provisional guidance “Based on amounts entered so far”; mark entirely blank pots “Not entered yet” and partly blank pots “Some amounts missing”. A pot with no rows has no entered allocation; existing empty-pot save rules remain unchanged.
- Row additions/removals, clearing amounts, multiple incomes/pots and editing in any order update the same global figure. Explicit zero counts as entered. Names and rollover settings do not affect arithmetic availability.
- Over-allocation shows its amount without clamping or changing inputs. No automatic allocations, new “Use remaining” action, API changes or persisted fields. Existing savings review and backend validation remain unchanged.

## Implementation and verification

The native draft adapter parses raw input into exact integer øre, missing or invalid values. A pure helper in budget-core uses the same exact summation as completed-plan calculations and reports partial-input metadata separately. UI components only render progress.

Passed: 35 native tests, 41 backend/shared tests, all-workspace TypeScript checking, formatting, contract drift, relative documentation links and `git diff --check`. Final iOS and Android Hermes exports passed using the existing Node 24.22.2 runtime. Tests cover the stated sequence, unchanged savings, incomplete and invalid amounts, independent name/rollover validation, row changes, explicit zero, multiple income rows/pots, ordering, overflow and over-allocation. Physical-device keyboard, screen-reader and visual verification remain pending; automated tests/exports do not establish usability.

The subsequent [focused-overlay layout](mobile-widget-editor-story.md#revised-widget-layout--focused-overlays) moves each pot’s guidance into its bottom-right cell and repeats it in the Fixed expenses overlay. The calculation and incomplete-input rules remain unchanged.
