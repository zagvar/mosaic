# Mosaic

Accessible, composable building blocks for broker- and exchange-neutral trading
interfaces.

Mosaic separates trading-domain behavior from presentation. The core package
provides schemas, validation, order preparation, quote previews, fees, and
order-book reconciliation. The React package provides accessible components and
hooks that host applications can style with their own design system.

> **Project status:** pre-release and source-first. The packages are not
> published to npm yet. Clone the repository to explore the API and run the
> interactive demo.

## Features

- Equity and crypto order rules
- Market and limit order tickets
- Quantity and notional order entry
- Tick-size, lot-size, precision, balance, and boundary validation
- Time-in-force selection
- Controlled and uncontrolled trade-draft state
- Localizable message-object APIs and locale-aware number formatting
- Order review, warnings, fee estimates, and confirmation states
- Quote display and selectable order-book levels
- Snapshot and incremental order-book reconciliation
- Accessible interaction primitives powered by React Aria
- Styling through explicit slot class names

## Packages

| Package | Purpose |
| --- | --- |
| [`@zagvar/mosaic-core`](packages/core) | Framework-free trading schemas, validation, summaries, and reducers |
| [`@zagvar/mosaic-react`](packages/react) | Accessible React components and state hooks |
| `@zagvar/mosaic-demo` | Private Vite demo app with an MSW market-data simulation |

## Try It Locally

Requirements:

- Node.js compatible with Vite 8
- pnpm 11

```bash
git clone https://github.com/zagvar/mosaic.git
cd mosaic
pnpm install
pnpm dev
```

The demo includes:

- an AAPL quote-driven equity ticket
- a BTC/USDT order book backed by mocked HTTP and WebSocket data
- selecting quote or order-book prices into a limit order
- order review and confirmation

## Basic Composition

```tsx
import { TradeTicket } from "@zagvar/mosaic-react";

<TradeTicket
  symbol="BTC/USDT"
  assetClass="crypto"
  assetRules={assetRules}
  cashAvailable={10_000}
  assetQtyAvailable={0.5}
  quoteCurrency="USDT"
  onSubmit={(order) => setOrderForReview(order)}
/>;
```

`TradeTicket` creates a validated `OrderIntent`. The host application is
responsible for obtaining any server-authoritative preview, displaying
`OrderReview`, and submitting the confirmed order to its backend.

## Design Principles

### Behavior, Not Branding

Mosaic provides behavior, validation, accessibility, state, and semantic
markup. Host applications provide presentation through slot `classNames`.

This works with plain CSS, CSS Modules, Tailwind, vanilla-extract, Panda,
Emotion, shadcn-style utilities, and company design systems.

### Backend Authority

Frontend validation improves usability but is not a security boundary. A
backend should revalidate account state, market state, permissions, order
rules, fees, and buying power before placing an order.

### Provider-Neutral Data

Broker and exchange payloads should be adapted at the application boundary.
Mosaic contracts intentionally avoid exposing provider-specific transport or
backend implementation details.

### Host-Controlled Review Presentation

`OrderReview` renders review content but does not force a modal. Applications
may place it inline, in a side panel, modal, sheet, or route while preserving
the same order-review behavior.

## Internationalization

Components accept plain message objects rather than depending on a translation
framework. They can be populated by i18next, React Intl, Lingui, JSON files, or
a company translation service.

React Aria locale context drives locale-aware number and date formatting.

## Accessibility

Mosaic uses semantic HTML and React Aria for keyboard interaction, focus
behavior, labeling, validation state, and assistive-technology support.
Applications remain responsible for accessible color contrast and styling.

## Architecture

- [Order-book snapshots, incremental updates, and synchronization](docs/order-book.md)

## Development

```bash
pnpm typecheck
pnpm test
pnpm build
```

Run only one package:

```bash
pnpm --filter @zagvar/mosaic-core test
pnpm --filter @zagvar/mosaic-react test
pnpm --filter @zagvar/mosaic-demo build
```

## Repository Structure

```text
apps/docs/       interactive demo app and MSW handlers
packages/core/   framework-free domain contracts
packages/react/  accessible React components
docs/            public architecture documentation
```

## License

[MIT](LICENSE)

Mosaic is UI infrastructure, not a broker, exchange, or source of financial
advice.
