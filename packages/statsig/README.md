# @effect-statsig/statsig

## Purpose

Shared Statsig config and user normalization models used by all runtime adapters.

## Installation

```bash
pnpm add @effect-statsig/statsig
```

## Quick start

```ts
import { parseStatsigConfig, parseStatsigUser } from "@effect-statsig/statsig"
```

## API overview

- `StatsigConfigSchema`
- `StatsigUserSchema`
- `parseStatsigConfig`
- `parseStatsigUser`

## Configuration

Requires environment and runtime key values where applicable.

## Error handling

Validation issues return `StatsigModelError`.

## Testing

Test both valid and invalid parsing cases.

## Troubleshooting

Ensure `environment` and `userId` are always present.

## Version compatibility

Works with all adapters in this monorepo.
