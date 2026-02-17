# @effect-statsig/buildtime

## Purpose

Buildtime flag ingestion and deterministic composition with remote providers.

## Installation

```bash
pnpm add @effect-statsig/buildtime
```

## Quick start

```ts
import { flagsFromEnv, composeFeatureFlags } from "@effect-statsig/buildtime"
```

## API overview

- `flagsFromInline`
- `flagsFromEnv`
- `flagsFromJson`
- `makeBuildtimeFeatureFlags`
- `composeFeatureFlags`

## Configuration

Supports inline maps, environment variables, and JSON payloads.

## Error handling

Parsing failures return `BuildtimeError`.

## Testing

Validate source parsing, precedence, and failure fallback behavior.

## Troubleshooting

Use lowercase flag keys for consistent gate lookup.

## Version compatibility

Works with all core-compatible runtime providers.
