# Mobile live budget helper

## Story

As a customer with a saved budget, I want booked and expected account movements to update the
correct budget pot automatically, so that the remaining monthly and weekly guidance reflects the
money I can still use.

This is an incremental delivery of US-06 and US-10. It applies the latest imported source snapshot;
it is not a continuous bank feed or a forecast.

## Acceptance criteria

- Booked bill debits reduce their matched Fixed expenses pot. They never reduce an everyday
  Spending pot.
- Other eligible booked debits reduce their matched Spending pot, or the first saved Spending pot
  when no unique match exists.
- Known pending debits reduce the relevant pot as pending commitments. A later booked version
  replaces the pending version and is counted once; a cancelled or released version contributes
  nothing.
- A debit with a known amount, date and target but an unknown booking status reduces the relevant
  pot conservatively as an unconfirmed commitment and remains visibly marked for review.
- Booked, pending and unconfirmed amounts are shown separately. Only booked movements are called
  recorded spending.
- Missing amount, direction, date or target remains an explicit limitation and can make the
  affected guidance unavailable. Missing values are never treated as zero.
- Scheduled payments, transfers, savings allocations and ordinary credits do not reduce a pot.
  A customer-confirmed refund restores the selected Spending or Fixed expenses pot.
- The overall monthly, weekly and daily guidance combines Spending pots only. Fixed expenses are
  displayed separately.
- Exact duplicate and pending-to-booked source versions do not double count. Conflicting source
  versions remain visible and reviewable.
- Bill discovery can propose a known recurring bill from pending evidence, but labels it Possible
  and requires customer review before it is saved.

## Boundaries

The calculation uses integer oere, an explicit snapshot date and zero configured opening carry-in.
It does not execute rollover, predict future purchases, reserve money at the bank, or infer that
scheduled bills have been paid.

## Verification

Verified on 11 November 2026 with Node 24:

- All 70 backend/shared tests passed. Focused calculation coverage includes pending bills versus
  everyday spending, unknown-status commitments, pending-to-booked replacement, cancellation,
  source collisions, fixed-expense refunds, missing essentials, transfers, credits, overspending,
  final-day/leap-year rounding and the DKK 2,800 guidance example.
- The focused native overview/activity suites passed all 9 tests. The full native suite passed 67
  and retained the same 9 pre-existing editor/creation failures caused by obsolete assumptions
  about an initial fixed-expense row; this change added no new failure.
- The isolated mobile API integration passed creation, reopen, summary, activity and correction
  refresh against a synthetic loopback backend. All-workspace builds and TypeScript passed.
- A read-only check of the running local demo returned one Possible Rent suggestion combining two
  pending monthly records, including Husleje with a named landlord and a record without that payee.
  Distinct named payees remain separate in automated tests.
- Contract drift, formatting, Expo dependency checks and iOS/Android Hermes exports passed. No
  database migration was added or applied for this calculation change. Native device layout,
  large-text and screen-reader checks could not run because no simulator/emulator was available.
