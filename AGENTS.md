# AGENTS.md - effect-statsig

## Mission

Build and maintain `effect-statsig` as an Effect-native, production-grade monorepo for feature flags, experimentation, and analytics with Statsig adapters.

## Core Rule

When in doubt, follow Effect source code practices.

- Prefer Effect naming and module structure.
- Prefer Effect-native abstractions (`Effect`, `Layer`, `Context`, `Schema`, tagged errors).
- If deviating, document why in the PR description.

## Scope

Primary delivery targets:

- `@effect-statsig/core`
- `@effect-statsig/statsig`
- `@effect-statsig/node`
- `@effect-statsig/browser`
- `@effect-statsig/react`
- `@effect-statsig/cloudflare`
- `@effect-statsig/expo`
- `@effect-statsig/buildtime`

## Active Specifications

- `effect-statsig-monorepo` - Effect-native Statsig monorepo with provider-agnostic services, runtime adapters, package docs, and runnable samples.

## Delivery Standards (Required)

Every package must ship with all of the following:

- implementation in `packages/<name>/src`
- tests in `packages/<name>/test`
- `packages/<name>/README.md`
- docs page at `docs/packages/<name>.md`
- at least one runnable sample in `examples/`

No package milestone is complete unless docs + sample + tests are included.

## Engineering Conventions

- Keep `@effect-statsig/core` provider-agnostic.
- Keep adapters thin and isolate SDK-specific code.
- Use scoped resource management for SDK lifecycle (`Effect.acquireRelease`).
- Model failure with typed/tagged errors, not unstructured exceptions.
- Keep public APIs minimal and stable.

## Testing and CI Gates

Before merge, all must pass:

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`
- docs and example verification jobs

Coverage targets:

- `core`: >= 90% lines
- adapters: >= 80% lines

## Work Planning

- Use `PLAN.md` task IDs (`P*`, `NXT-*`) in PR descriptions.
- Keep progress auditable: list completed tasks, blockers, changed files, and validation commands.
- Prefer small, phase-aligned PRs over large mixed changes.

## Documentation Expectations

Package README minimum sections:

1. Purpose
2. Installation
3. Quick start
4. API overview
5. Configuration
6. Error handling
7. Testing
8. Troubleshooting
9. Version compatibility

Sample README minimum sections:

1. Scenario
2. Required env vars
3. Run commands
4. Verification steps
5. Common failures
