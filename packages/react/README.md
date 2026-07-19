# `@zagvar/mosaic-react`

Accessible, minimally styled React trading components for Mosaic.

> Pre-release: published under the `@zagvar` scope. The repository's main
> branch may contain the next unreleased version.

## Components

- `TradeTicket`
- `TradeSideToggle`
- `OrderTypeToggle`
- `TifSelect`
- `OrderReview`
- `QuoteDisplay`
- `OrderBook`
- `RecentTrades`
- `TradingChart`
- `useTradeDraft`

## Styling

Components expose slot-based `classNames`. Mosaic owns behavior and
accessibility; the consuming application owns presentation.

```tsx
<OrderBook
  snapshot={snapshot}
  quoteCurrency="USD"
  classNames={{
    root: styles.book,
    level: styles.level,
    bidLevel: styles.bid,
    askLevel: styles.ask,
    depthBar: styles.depth,
  }}
  onSelectPrice={(price) => setLimitPrice(price)}
/>;
```

## Internationalization

Every visible component string can be replaced through plain message objects.
This keeps the package independent of i18next, React Intl, Lingui, or any other
host translation system.

Wrap the application in React Aria's `I18nProvider` to control locale-aware
decimal and date formatting. Economic props and values emitted by components
are canonical decimal strings, such as `"195.75"` or `"0.000001"`; keep them
as strings in host state and API payloads.

## Order Flow

`TradeTicket` produces an `OrderIntent`. `OrderReview` displays an
application-supplied `OrderSummary` and confirmation state. The host controls
backend preview requests, final submission, error mapping, and whether review
appears inline, in a panel, modal, sheet, or route.

## Market Data

`QuoteDisplay`, `OrderBook`, `RecentTrades`, and `TradingChart` are display
components. Host applications own data fetching, WebSocket subscriptions,
provider adapters, stale-data policy, and any backend validation before order
placement.
