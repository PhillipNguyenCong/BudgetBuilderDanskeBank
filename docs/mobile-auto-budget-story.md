# Create Auto Budget — US-03 / US-04

Status: implemented and automatically verified; native-device checks pending. Supports FR-03,
FR-07 and NFR-04. This is a deterministic allocation guide, not AI or a forecast.

## Acceptance criteria

- New budgets contain Income, Fixed expenses, Groceries, Fun budget and Savings in that
  order. Groceries and Fun are independent Spending pots with separate rollover rules.
- Create Auto Budget opens a confirmation explaining replacement of the draft allocations,
  inclusion of detected bills and both percentage rules. Cancel changes nothing. Confirm
  starts discovery and allocation; success fills the draft without another Apply action.
- The confirmation now requires a car-ownership answer. Yes inserts a car-cost review after
  discovery and before allocation; No follows the direct flow. See the subsequent
  [car-checklist criteria](mobile-car-checklist-story.md).
- Use entered monthly take-home income and actual monthly-equivalent bills. At or below
  50% bills, Groceries fills the rest of 50%, Fun receives 30% and Savings 20%.
- Above 50% bills, use 85/5/10: actual bills plus Groceries receive 85%, Fun 5% and
  Savings 10%. Bills are never reduced. Above 85% bills, leave the draft unchanged and
  explain the capacity problem. Zero groceries is allowed with a warning.
- Use exact integer oere. Round the combined needs target and Fun down, assigning the
  remainder to Savings. Allocate the complete income, including fractional DKK amounts.
- Include recurring and possible suggestions, disclose uncertainty, deduplicate existing
  bills, preserve manual edits and exclude deliberately dismissed suggestions. Missing
  income/bill amounts, discovery failure and overflow cannot
  produce a partial or guessed allocation. Offer correction/retry without losing inputs.
- Bill frequency defaults to Monthly when not supplied, without extra confirmation.
  Explicit quarterly, half-yearly and yearly frequencies and customer edits are preserved.
  Unknown original frequency remains null in source evidence; Monthly is a planning default.
- Loading prevents duplicate runs and draft editing. Cancellation, unmount and stale
  requests cannot apply results. Applying updates committed allocation guidance too.
- Results remain editable and unsaved. Only the existing review/Create budget action
  persists the accepted plan. Subsequent edits never trigger redistribution.
- Unmatched purchases go to Fun when that purpose exists. Existing name matching and
  manual corrections remain; older plans retain their first-Spending-pot default.

## Verification

Passed: 91 backend/shared tests, 136 native tests and two synthetic HTTP integration tests.
The integration covers account salary/bill discovery, auto allocation, explicit persistence,
reopening, distinct Groceries/Fun guides and the Fun fallback. Native tests cover confirmation,
cancel/retry/unmount, duplicate requests, stale results, manual bill completion, preserved
edits, automatic fallback and the separate review/save flow. Financial tests cover all agreed
examples, exact thresholds, irregular bills, integer-oere rounding and overflow.

The subsequent Monthly-default refinement removes the frequency-confirmation gate from
manual entry, live allocation guidance and auto allocation. Regression coverage verifies
missing/null frequency defaults to Monthly, explicit quarterly/half-yearly/yearly values
remain unchanged, unknown source frequency survives save/reopen as null, and missing
amounts still block allocation. The synthetic HTTP flow exercises real bill suggestions
with missing cadence without persisting a draft automatically.

All-workspace typechecking, formatting, generated-contract drift, 105 relative documentation
links and `git diff --check` passed. iOS and Android Hermes exports passed using the existing
Node 24.22.1 runtime. Expo dependency checking passed against its offline compatibility map;
the online version endpoint was unavailable. No dependencies changed.

HTTP tests used isolated synthetic loopback servers with memory storage. No shared database
check, migration, cloud resource, deployment or bank-data upload was performed. Device visual,
keyboard, screen-reader and usability verification remain pending. Automated checks and
bundling do not establish usability or forecast accuracy. Full AI generation, grocery merchant
detection and saved-plan editing remain separate work.
