# @effect-statsig/cloudflare

## Purpose

Cloudflare Worker adapter for edge-safe feature evaluation behavior.

## Installation

```bash
pnpm add @effect-statsig/cloudflare
```

## Quick start

```ts
import { makeCloudflareLayer } from "@effect-statsig/cloudflare"
```

## API overview

- `makeCloudflareServices`
- `makeCloudflareLayer`
- `CloudflareStatsigClient`

## Configuration

Requires edge-compatible client key configuration and user context.

## Error handling

Returns `CloudflareAdapterError` and mapped core errors.

## Testing

Use worker-like mock clients in scoped Effect tests.

## Troubleshooting

Verify edge runtime assumptions in integration tests.

## Version compatibility

Designed for Cloudflare Worker style runtimes.
