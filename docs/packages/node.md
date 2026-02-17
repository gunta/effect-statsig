# node

## Concepts

`@effect-statsig/node` maps core contracts to Node server runtime behavior.

## Runtime requirements

Node-compatible runtime and server-side key handling.

## Setup

Provide a runtime client, config, and user to `makeNodeLayer`.

## Integration patterns

Scope the layer around request-handling workflows to guarantee cleanup.

## Samples

- `examples/node-server`

## API docs

Exports are available from `@effect-statsig/node` index.

## FAQ

If initialization appears to be skipped, ensure the program runs inside `Effect.scoped`.
