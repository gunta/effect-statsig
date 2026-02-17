# buildtime

## Concepts

`@effect-statsig/buildtime` provides deterministic local flag sources and composition with remote evaluation.

## Runtime requirements

No provider runtime is required for standalone buildtime mode.

## Setup

Load flags from inline/env/json and optionally compose with remote services.

## Integration patterns

Use `buildtime-first` for guardrails and `remote-first` for progressive fallback.

## Samples

- `examples/buildtime-flags`

## API docs

Exports are available from `@effect-statsig/buildtime` index.

## FAQ

Invalid source values return `BuildtimeError` during parsing.
