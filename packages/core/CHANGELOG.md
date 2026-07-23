# @zagvar/mosaic-core

## 0.4.0

### Minor Changes

- 89c2d5e: Add provider-neutral contracts for order records, lifecycle statuses, fills, fees, events, server-driven queries, cursor pages, updates, and deterministic page reconciliation.

## 0.3.0

### Minor Changes

- 27af705: Migrate public trading values from JavaScript numbers to canonical decimal
  strings. Decimal contracts and helpers now come directly from the shared
  `@zagvar/decimal` package instead of a Mosaic Core proxy.

## 0.2.0

### Minor Changes

- Align Mosaic market-data and trading contracts around venue-aware identities, ISO timestamps, and explicit price and quantity semantics.
