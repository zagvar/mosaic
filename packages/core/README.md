# `@zagvar/mosaic-core`

Framework-free trading contracts and utilities for Mosaic.

> Pre-release: published under the `@zagvar` scope. The repository's main
> branch may contain the next unreleased version.

## Included

- Asset and order schemas
- Decimal-safe order validation
- `OrderIntent` creation
- Fee and quote-preview validation
- Order-summary and warning generation
- Market-reference contracts
- Market candle and trade contracts
- Order-book snapshots, updates, and reconciliation

## Example

```ts
import { createOrderIntent } from "@zagvar/mosaic-core";

const result = createOrderIntent(draft, {
  assetRules,
  cashAvailable: "10000",
  assetQuantityAvailable: "0.5",
});

if (result.valid) {
  await reviewOrderOnServer(result.order);
}
```

External API responses and WebSocket messages should be validated or adapted
before entering application state. Frontend validation does not replace
server-side order validation.

## Decimal Values

Every public economic value is a canonical `DecimalString`: prices, quantities,
balances, notionals, fees, and market-data values. Use ordinary unsigned base-10
strings such as `"195.75"` or `"0.000001"`; exponent notation, signs, leading
zeroes, and unnecessary trailing zeroes are rejected.

The package validates these values strictly and uses exact decimal arithmetic
for comparisons and calculations. Keep them as strings at application and API
boundaries; convert only for display when necessary.

Import `DecimalString`, its schemas, and arithmetic helpers directly from
`@zagvar/decimal`. Mosaic Core uses that shared package internally rather than
defining or proxying a second decimal API.

See the
[order-book architecture guide](../../docs/order-book.md) for snapshot,
incremental-update, and resynchronization details.
