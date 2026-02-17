# @effect-statsig/core

## Purpose

Provider-agnostic Effect service contracts for feature flags, analytics, experiments, and dynamic config.

## Installation

```bash
pnpm add @effect-statsig/core
```

## Quick start

```ts
import { FeatureFlags } from "@effect-statsig/core"
```

## API overview

- `FeatureFlags`
- `Analytics`
- `Experiments`
- `DynamicConfig`
- typed errors and no-op service layers

## Configuration

No provider configuration is required in this package.

## Error handling

Uses tagged Effect errors per domain service.

## Testing

Use no-op layers and Effect-provided services to test behavior.

## Troubleshooting

If provider-specific types appear in app code, move that logic into adapter packages.

## Version compatibility

Designed for modern Effect v3 environments.
