# Budget core

Framework-independent, deterministic normalization and allocation calculations. No HTTP, database or UI dependencies. The backend executes these functions with explicit inputs and cutoff dates. Normalization uses Node's built-in SHA-256; it is server-side logic rather than a browser parsing responsibility.

- `allocations`: integer-øre totals using BigInt intermediates; over-allocation and safe-number overflow checks. Import `@budget-builder/budget-core/allocations` in native clients to avoid Node-only normalization dependencies. `proposeSavingsUpdate` returns a before/after proposal for one explicitly selected savings row, preserving other rows and rejecting an impossible negative target; it never mutates the plan or applies changes automatically.
- `normalization`: conservative source parsing, explicit unknowns, deterministic IDs and quality metadata.

`calculateAllocationProgress` provides provisional manual-setup guidance from exact amounts, missing values and explicitly invalid inputs. It shares exact summation with completed-plan calculations, reports incomplete pots separately, requires complete income and never mutates or fills inputs. Missing pot amounts are excluded from the entered allocation total, not confirmed as zero. This helper does not replace authoritative backend validation when saving.

Money source values are major currency units; `decimals` is treated as display metadata. Mixed grouping/decimal notation is accepted only where unambiguous. Inputs with more than two fractional digits are rejected rather than guessed. Currency must be explicit: prefer a DKK account amount, then DKK source amount, then a positive supplied FX rate interpreted as DKK per foreign unit (flagged). FX rounding is half-up to øre. Missing currency or unusable conversion is retained as an issue/null.

Transaction direction uses explicit debit/credit, not sign. Payments without direction remain unknown even if labels imply salary or a transfer. Booked/reserved status variants are normalized; unknown/conflicting statuses remain unknown. Supported dates include ISO, day-first slash/dash, compact YYYYMMDD and YYYY/MM/DD. Valid timestamps are converted to Europe/Copenhagen dates. Value-date fallback is flagged. Future-dated records remain visible.

Identical raw records are deduplicated by canonical content. Distinct records sharing a source ID survive with collision issues; internal IDs are account-scoped SHA-256 fingerprints. Re-importing identical input preserves IDs. A changed source record gets a new fingerprint: version reconciliation and customer assignment preservation are deferred with transaction-assignment implementation.

Coverage is a declared/inferred date interval, not proof of valid daily observations. Only completed calendar months inside that interval count; inferred boundaries and limited history are flagged. No categories, actual-spending totals, forecasts, AI recommendations or month-close execution are provided yet.

Run root tests/type checking/build commands. Synthetic fixtures cover malformed input; the supplied raw dataset is not a committed test fixture.

`monthlyBillAllocation(amountOere, frequency)` converts fixed-expense payment amounts to monthly allocations with integer arithmetic. Frequency defaults to Monthly; divisors are 1, 3, 6 and 12. Each bill is rounded up to the nearest oere before totals are summed. `calculatePlan` and backend validation use these monthly amounts. This does not determine due dates or catch-up funding.
