# Car-expense checklist — US-04 / US-05 / US-10

Status: implemented and automatically verified; device checks pending.

## Acceptance criteria

- Create Auto Budget asks whether the customer has a car before Confirm. No answer is
  preselected. No follows the existing bill discovery/allocation flow.
- Yes discovers bills, then opens a curated checklist before allocation: vehicle tax /
  ejerafgift, car insurance, fuel/charging, service/repairs, tyre changes and vehicle inspection
  / syn. This is a deterministic checklist, not AI or a guarantee of complete costs.
- Recognized existing/detected bills are shown as already included, preserving their labels,
  payment amounts, frequencies and source evidence unless explicitly corrected in the checklist. Missing categories start with blank
  amounts; the customer must enter an amount or explicitly skip each missing category.
- Vehicle tax and insurance accept payment amount/frequency, defaulting to Monthly unless
  otherwise supplied. Fuel/charging and irregular costs use explicitly labelled monthly
  planning reserves, not invented payments or inspection schedules.
- Re-running matches stable car-expense metadata as well as conservative English/Danish
  labels, avoiding duplicate reserves after renamed rows. Generic insurance/service labels
  alone are insufficient evidence. Existing bills are never deleted by answering No or
  skipping a missing category.
- Accepted amounts enter Fixed expenses before the existing 50/30/20 or 85/5/10 calculation.
  Missing amounts, overflow and capacity failures preserve the original draft. Cancel,
  unmount and stale results apply nothing; explicit budget saving remains separate.
- Persist only accepted planning rows and their optional category/basis metadata, not a
  global car-ownership profile. Source-derived costs retain uncertainty/provenance. Unknown
  amounts are not zero, and no prices or actual car obligations are invented.

## Verification

Passed: 94 backend/shared tests, 143 native tests and two synthetic HTTP integration tests.
Coverage includes conservative category recognition, renamed-row metadata, monthly reserve
validation, exact allocation/fallback after adding car costs, mandatory Yes/No, explicit skip,
blank amounts, correction of incomplete detected bills, cancellation, repeated-run deduplication,
and separate explicit saving. The HTTP flow persists/reopens a monthly syn reserve with its
category and basis intact while retaining independent Groceries/Fun guidance.

All-workspace typechecking, formatting, generated-contract drift, relative documentation links
and `git diff --check` passed. iOS and Android Hermes exports passed using the existing Node
24.22.1 runtime. No database migration, shared-database action, external AI request, data upload
or deployment was performed. Existing transaction matching/corrections remain unchanged;
the checklist does not establish complete expense detection or automatically link every future
car payment. Device layout, keyboard, screen-reader and usability checks remain pending.
