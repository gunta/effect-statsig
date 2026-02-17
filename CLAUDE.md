# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install                # install all dependencies
pnpm build                  # build all packages (turbo, respects dependency graph)
pnpm typecheck              # type-check all packages
pnpm lint                   # lint via scripts/lint.mjs
pnpm test                   # unit tests with coverage + coverage policy check
pnpm test:integration       # integration tests (requires STATSIG_SDK_KEY env var)
pnpm test:e2e               # e2e tests (e2e/runtime-parity.e2e.test.ts)
pnpm test:examples          # smoke-test all examples
pnpm check:all              # full CI pipeline: lint, typecheck, test, build, docs, examples
pnpm changeset              # add a changeset for version bumps
```

Run a single package's tests:
```bash
pnpm vitest run packages/core/test --config vitest.config.ts
```

Run a single test file:
```bash
pnpm vitest run packages/core/test/core.test.ts --config vitest.config.ts
```

Build a single package: `pnpm --filter @effect-statsig/core build`

Packages build with **tsup** (`tsup src/index.ts --dts --format esm,cjs --clean`).

## Architecture

This is a **pnpm workspace monorepo** with **Turborepo** orchestration. All packages live in `packages/`, runnable examples in `examples/`.

### Package Dependency Graph

```
@effect-statsig/core          ← provider-agnostic service contracts (zero Statsig imports)
@effect-statsig/statsig       ← shared Statsig config, user model, Schema codecs (depends on core)
@effect-statsig/node          ← Node.js server adapter (depends on statsig)
@effect-statsig/browser       ← browser client adapter (depends on statsig)
@effect-statsig/react         ← React hooks + provider (depends on browser)
@effect-statsig/cloudflare    ← Cloudflare Workers adapter (depends on statsig)
@effect-statsig/expo          ← React Native/Expo adapter (depends on statsig)
@effect-statsig/buildtime     ← compile-time flag evaluation (depends on core only)
```

### Core Services (`packages/core/src/`)

Four Effect `Context.Tag` services define the public API — all platform-agnostic:

- **FeatureFlags** — `check`, `checkWithExposure` → `Effect<boolean, FeatureFlagError>`
- **Experiments** — `get`, `getLayer` → `Effect<ExperimentValue, ExperimentError>`
- **DynamicConfig** — `get` → `Effect<DynamicConfigValue, DynamicConfigError>`
- **Analytics** — `logEvent`, `flush`, `shutdown` → `Effect<void, AnalyticsError>`

Errors are tagged classes (`Data.TaggedError`) in `packages/core/src/errors.ts`.

Noop implementations for all four services are in `packages/core/src/Noop.ts` — use these for testing.

### Adapter Pattern

Each platform adapter (node, browser, cloudflare, expo) follows the same structure:
1. Define a client interface (e.g., `NodeStatsigClient`) wrapping raw SDK calls
2. `makeXxxServices()` maps client methods to core service implementations, wrapping errors with `Effect.tryPromise` + `Effect.mapError`
3. `makeXxxLayer()` composes `Effect.acquireRelease` for SDK lifecycle with `Layer.mergeAll` of all four services

### Shared Statsig Package (`packages/statsig/src/`)

Contains `@effect/schema` codecs for `StatsigConfig` and `StatsigUser`, plus `StatsigModelError`. Used by all adapters except `buildtime`.

### React Package (`packages/react/src/`)

Provides `StatsigProvider` (React component), context, and hooks: `useFeatureFlag`, `useExperiment`, `useDynamicConfig`, `useAnalytics`.

## Conventions

- Follow Effect source code practices (naming, module structure, `Effect`/`Layer`/`Context`/`Schema`/tagged errors).
- Keep `@effect-statsig/core` provider-agnostic — no Statsig imports.
- Keep adapter packages thin — only glue between Statsig SDK and core contracts.
- Use `Effect.acquireRelease` for SDK lifecycle management in adapters.
- Prettier: no semicolons, double quotes, no trailing commas.

## Coverage Requirements

- **core**: >= 90% line coverage
- **adapters**: >= 80% line coverage
- `pnpm test` automatically runs `scripts/check-coverage.mjs` which enforces 100% total lines/statements/functions/branches plus the per-package thresholds above.

## Test File Layout

- Unit tests: `packages/<name>/test/<name>.test.ts`
- Integration tests: `packages/<name>/test/<name>.integration.test.ts` (need `STATSIG_SDK_KEY`)
- E2E tests: `e2e/*.e2e.test.ts`
- Vitest config: `vitest.config.ts` (unit/integration), `vitest.e2e.config.ts` (e2e)
- Path aliases are configured in both `tsconfig.base.json` and `vitest.config.ts` so imports like `@effect-statsig/core` resolve to source during development.
