# react

## Concepts

`@effect-statsig/react` exposes provider and hooks on top of core services.

## Runtime requirements

React 18+ and service implementations from browser or compatible adapters.

## Setup

Wrap app trees with `StatsigProvider` and call hooks in descendants.

## Integration patterns

Use hydration values for SSR-to-CSR continuity.

## Samples

- `examples/react-spa`
- `examples/nextjs-app`

## API docs

Exports are available from `@effect-statsig/react` index.

## FAQ

Hooks throw if `StatsigProvider` is missing.
