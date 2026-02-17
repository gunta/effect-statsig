# core

## Concepts

`@effect-statsig/core` defines provider-agnostic service contracts and typed errors.

## Runtime requirements

Requires Effect runtime support.

## Setup

Install and provide service implementations through Effect layers.

## Integration patterns

Consume only core contracts in app domains and move provider logic into adapter packages.

## Samples

- `examples/core-contracts`

## API docs

Exports are available from `@effect-statsig/core` index.

## FAQ

Use no-op layers for tests when provider behavior is not under test.
