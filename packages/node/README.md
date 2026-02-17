# @effect-statsig/node

## Purpose

Node runtime adapter that maps core contracts to server-side Statsig behavior.

## Installation

```bash
pnpm add @effect-statsig/node
```

## Quick start

```ts
import { makeNodeLayer } from "@effect-statsig/node"
```

## API overview

- `makeNodeServices`
- `makeNodeLayer`
- `NodeStatsigClient`

## Configuration

Requires server-side configuration and user context.

## Error handling

Returns `NodeAdapterError` and mapped core domain errors.

## Testing

Use mock client objects for deterministic lifecycle and behavior tests.

## Troubleshooting

Verify initialization runs inside an Effect scope.

## Version compatibility

Compatible with Node and Bun server workloads.
