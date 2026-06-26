# Internal Release Notes

This is maintainer-facing release guidance. Keep user-facing package usage in
the root and package READMEs.

## Preflight

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @zagvar/mosaic-core publish --dry-run
pnpm --filter @zagvar/mosaic-react publish --dry-run
```

Use `pnpm publish`, not raw `npm publish`, because workspace dependencies such
as `@zagvar/mosaic-core: "workspace:*"` are rewritten by pnpm when packing and
publishing workspace packages.

## Changesets

For normal releases after the initial publish:

```bash
pnpm changeset
pnpm version
pnpm release
```

`pnpm changeset` records the package changes and semver bump. `pnpm version`
updates package versions, changelogs, and internal dependency ranges. `pnpm
release` publishes the versioned packages.

## Publish

Publish scoped packages publicly, ideally from CI with npm trusted publishing
and provenance enabled:

```bash
pnpm --filter @zagvar/mosaic-core publish --access public --provenance
pnpm --filter @zagvar/mosaic-react publish --access public --provenance
```

After publishing, verify the registry output:

```bash
npm view @zagvar/mosaic-core version
npm view @zagvar/mosaic-react version
```
