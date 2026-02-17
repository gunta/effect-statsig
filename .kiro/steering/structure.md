# Structure Steering

- Use monorepo layout with `packages/`, `examples/`, `docs/`, and `scripts/`.
- Keep provider-agnostic behavior in `packages/core`.
- Keep runtime-specific adapter behavior in adapter packages only.
- Keep tests inside each package `test/` directory.
