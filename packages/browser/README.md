# @effect-statsig/browser

## Purpose

Browser adapter for gate, experiment, dynamic config, and analytics workflows.

## Installation

```bash
pnpm add @effect-statsig/browser
```

## Quick start

```ts
import { makeBrowserLayer } from "@effect-statsig/browser"
```

## API overview

- `makeBrowserServices`
- `makeBrowserLayer`
- `updateBrowserUser`

## Configuration

Requires client-side key configuration and initial user context.

## Error handling

Returns `BrowserAdapterError` and mapped core errors.

## Testing

Validate initialization, evaluation, and user update behavior.

## Troubleshooting

Ensure browser client initialization completes before evaluation.

## Version compatibility

Intended for modern browser and web worker contexts.
