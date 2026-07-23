# @zagvar/mosaic-react

## 0.4.0

### Minor Changes

- 89c2d5e: Add accessible OrdersPanel and OrderDetails components and the useOrdersQuery hook, including mixed-instrument formatting, filters, sorting, cursor pagination, and host-controlled order actions.

### Patch Changes

- Updated dependencies [89c2d5e]
  - @zagvar/mosaic-core@0.4.0

## 0.3.0

### Minor Changes

- 27af705: Migrate public trading values from JavaScript numbers to canonical decimal
  strings. Decimal contracts and helpers now come directly from the shared
  `@zagvar/decimal` package instead of a Mosaic Core proxy.

### Patch Changes

- Updated dependencies [27af705]
  - @zagvar/mosaic-core@0.3.0

## 0.2.1

### Patch Changes

- Preserve chart data when theme, height, or volume configuration changes.

## 0.2.0

### Minor Changes

- Align Mosaic market-data and trading contracts around venue-aware identities, ISO timestamps, and explicit price and quantity semantics.

### Patch Changes

- Updated dependencies
  - @zagvar/mosaic-core@0.2.0
