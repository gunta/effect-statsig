# Contributing

## Workflow

1. Create a branch from `main`.
2. Implement spec tasks with tests.
3. Run `pnpm check:all`.
4. Add a changeset for user-visible changes.
5. Open a PR with task IDs from `.kiro/specs/effect-statsig-monorepo/tasks.md`.

## Standards

- Follow Effect source code practices when in doubt.
- Keep APIs provider-agnostic in `@effect-statsig/core`.
- Keep runtime adapters thin and lifecycle-safe.
