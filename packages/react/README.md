# @effect-statsig/react

## Purpose

React provider and hooks for consuming feature evaluation services.

## Installation

```bash
pnpm add @effect-statsig/react
```

## Quick start

```ts
import { StatsigProvider, useFeatureFlag } from "@effect-statsig/react"
```

## API overview

- `StatsigProvider`
- `useFeatureFlag`
- `useExperiment`
- `useDynamicConfig`
- `useAnalytics`

## Configuration

Provide service implementations and optional hydration data.

## Error handling

Hook state includes captured error text for failed async evaluations.

## Testing

Use jsdom and React testing utilities for provider/hook behavior.

## Troubleshooting

Wrap hook consumers with `StatsigProvider`.

## Version compatibility

Compatible with React 18+.
