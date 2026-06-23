# Mosaic

Accessible, composable trading UI components and utilities.

Mosaic is a small monorepo for broker- and exchange-neutral trading interfaces.
The core package provides framework-free order schemas and validation. The React
package provides accessible primitives and a composed trade ticket.

## Packages

- `@mosaic/core`: order schemas, asset rules, decimal-safe validation
- `@mosaic/react`: React components and hooks
- `@mosaic/docs`: local demo app

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Run the docs app:

```bash
pnpm dev
```

## Design Direction

Mosaic focuses on behavior, validation, and accessibility. Host applications
provide presentation through slot class names and their own design systems.
