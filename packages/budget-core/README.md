# Budget core

Framework-independent, deterministic normalization and allocation calculations. No HTTP, database or UI dependencies. The backend executes these functions with explicit inputs and cutoff dates. Normalization uses Node's built-in SHA-256; it is server-side logic rather than a browser parsing responsibility.

- `allocations`: integer-øre totals using BigInt intermediates; over-allocation and safe-number overflow checks.
- `normalization`: conservative source parsing, explicit unknowns, deterministic IDs and quality metadata.

Money source values are major currency units; `decimals` is treated as display metadata. Mixed grouping/decimal notation is accepted only where unambiguous. Inputs with more than two fractional digits are rejected rather than guessed. Currency must be explicit: prefer a DKK account amount, then DKK source amount, then a positive supplied FX rate interpreted as DKK per foreign unit (flagged). FX rounding is half-up to øre. Missing currency or unusable conversion is retained as an issue/null.

Transaction direction uses explicit debit/credit, not sign. Payments without direction remain unknown even if labels imply salary or a transfer. Booked/reserved status variants are normalized; unknown/conflicting statuses remain unknown. Supported dates include ISO, day-first slash/dash, compact YYYYMMDD and YYYY/MM/DD. Valid timestamps are converted to Europe/Copenhagen dates. Value-date fallback is flagged. Future-dated records remain visible.

Identical raw records are deduplicated by canonical content. Distinct records sharing a source ID survive with collision issues; internal IDs are account-scoped SHA-256 fingerprints. Re-importing identical input preserves IDs. A changed source record gets a new fingerprint: version reconciliation and customer assignment preservation are deferred with transaction-assignment implementation.

Coverage is a declared/inferred date interval, not proof of valid daily observations. Only completed calendar months inside that interval count; inferred boundaries and limited history are flagged. No categories, actual-spending totals, forecasts, AI recommendations or month-close execution are provided yet.

Run root tests/type checking/build commands. Synthetic fixtures cover malformed input; the supplied raw dataset is not a committed test fixture.
