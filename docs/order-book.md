# Order Book Architecture

Mosaic models an order book as a complete snapshot followed by incremental
updates. The model is exchange-neutral: applications adapt provider payloads
into Mosaic contracts before passing them to the reducer or React component.

## Data Contracts

`OrderBookSnapshot` is a complete local view at one point in time:

- bids are unique and sorted from highest to lowest price
- asks are unique and sorted from lowest to highest price
- quantities are positive
- the best bid must not exceed the best ask
- an optional sequence identifies the state represented by the snapshot

`OrderBookUpdate` is a batch of changed levels:

- `bids` contains changed bid levels
- `asks` contains changed ask levels
- positive quantity inserts or replaces a level
- zero quantity removes a level
- unchanged levels are omitted
- `reset: true` treats the event as a complete replacement

Incremental does not mean that an event contains exactly one level. Exchanges
often group every change produced during a short publishing interval into one
message. An update may therefore contain zero, one, or many bid and ask changes.

## Synchronization Flow

A typical consumer follows this sequence:

1. Opens the WebSocket and temporarily buffers update events.
2. Fetches a complete snapshot.
3. Discards buffered events already represented by the snapshot.
4. Applies subsequent updates in sequence.
5. Fetches a fresh snapshot if sequence continuity is lost.

Mosaic separates those responsibilities:

- schemas validate external snapshots and updates
- `applyOrderBookUpdate` reconciles one update with local state
- the host application owns transport, buffering, retry, and resubscription
- the React `OrderBook` renders an already-maintained snapshot

The docs app demonstrates a smaller version of this flow with an MSW HTTP
snapshot and WebSocket update stream.

### Demo Limitation

The MSW demo fetches its snapshot before opening the update stream. That is safe
for its deterministic mock because no updates exist before a client connects.

A production adapter should follow the provider's synchronization procedure.
For exchanges such as Binance, this generally means opening the stream,
buffering events, fetching a snapshot, and then replaying only events newer than
that snapshot. Mosaic's reducer provides the reconciliation and continuity
checks, but the host integration owns that buffering procedure.

## Reducer Safety

`applyOrderBookUpdate` refuses to apply an event when:

- its instrument does not match the snapshot
- its sequence is older than or equal to local state
- its declared previous sequence does not match local state

A sequence gap means the local book may be incomplete. The correct recovery is
to discard the stream state, fetch a new snapshot, and subscribe again.

Providers without sequence information may omit sequence fields. In that case,
the reducer can reconcile levels but cannot detect dropped events.

## Provider Adapters

Exchange payloads should be translated at the application boundary rather than
embedded in Mosaic components.

For example:

- Binance diff-depth events contain arrays of changed bids and asks. Quantity
  zero removes a level, and update IDs establish continuity.
- Coinbase Level 2 sends a snapshot followed by price-level changes.
- Kraken Level 2 sends snapshots and batched bid/ask updates with checksums and
  timestamps.

Adapters may also convert decimal strings into numbers or another application
representation before validation. Mosaic currently uses JavaScript numbers for
the display-oriented book contract; execution and accounting systems should
retain their own decimal-safe source of truth.

## Rendering

The React component:

- limits visible rows with `depth`
- computes cumulative quantity independently for each side
- renders asks above the spread and bids below it
- exposes selectable price levels when `onSelectPrice` is provided
- preserves accessible bid and ask region names even when visual side labels
  are omitted
- exposes slot class names, including `depthBar`, for host styling

The component does not open sockets, fetch snapshots, or understand a specific
exchange protocol.

## References

- [Binance diff-depth stream](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams#diff-depth-stream)
- [Coinbase Exchange Level 2 channel](https://docs.cdp.coinbase.com/exchange/websocket-feed/channels#level2-channel)
- [Kraken WebSocket v2 book channel](https://docs.kraken.com/api/docs/websocket-v2/book/)
- [Google TypeScript comments and documentation](https://google.github.io/styleguide/tsguide.html#comments-documentation)
