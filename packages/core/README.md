# `@zagvar/mosaic-core`

Framework-free trading contracts and utilities for Mosaic.

> Pre-release: this package is currently consumed from the workspace and is not
> published to npm.

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
  cashAvailable: 10_000,
  assetQuantityAvailable: 0.5,
});

if (result.valid) {
  await reviewOrderOnServer(result.order);
}
```

External API responses and WebSocket messages should be validated or adapted
before entering application state. Frontend validation does not replace
server-side order validation.

See the
[order-book architecture guide](../../docs/order-book.md) for snapshot,
incremental-update, and resynchronization details.
