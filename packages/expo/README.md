# @effect-statsig/expo

## Purpose

Expo and React Native adapter for mobile feature evaluation behavior.

## Installation

```bash
pnpm add @effect-statsig/expo
```

## Quick start

```ts
import { makeExpoLayer } from "@effect-statsig/expo"
```

## API overview

- `makeExpoServices`
- `makeExpoLayer`
- `updateExpoUser`

## Configuration

Requires mobile client key configuration and user context.

## Error handling

Returns `ExpoAdapterError` and mapped core errors.

## Testing

Use mock mobile clients and lifecycle integration tests.

## Troubleshooting

Ensure mobile initialization and user update ordering are deterministic.

## Version compatibility

Designed for Expo and React Native client flows.
