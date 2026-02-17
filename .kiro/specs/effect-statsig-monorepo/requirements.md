# Requirements Document

## Introduction

`effect-statsig` provides an Effect-native monorepo for Statsig integrations.  
The business value of this feature is to give teams a consistent, provider-agnostic core with multi-runtime adapters, buildtime flags, package-level documentation, and runnable samples, reducing adoption risk and long-term maintenance cost.

## Requirements

### Requirement 1: Provider-Agnostic Core Contracts
**Objective:** As a library consumer, I want a common interface for feature flags, analytics, experiments, and dynamic config, so that I can reduce migration cost when changing providers.

#### Acceptance Criteria
1. WHEN a developer uses `@effect-statsig/core` THEN effect-statsig Monorepo SHALL expose `FeatureFlags`, `Analytics`, `Experiments`, and `DynamicConfig` contracts.
2. IF a developer swaps provider implementations THEN effect-statsig Monorepo SHALL preserve type compatibility at the core public API boundary.
3. WHILE an application depends on core contracts THE effect-statsig Monorepo SHALL keep Statsig-specific types out of core public APIs.
4. WHERE a core service call fails THE effect-statsig Monorepo SHALL return a tagged error type that identifies the failure reason.

### Requirement 2: Shared Statsig Domain Model
**Objective:** As an adapter maintainer, I want shared config and user models, so that runtime-specific packages do not duplicate core Statsig data definitions.

#### Acceptance Criteria
1. WHEN a developer uses `@effect-statsig/statsig` THEN effect-statsig Monorepo SHALL provide shared `StatsigConfig` and `StatsigUser` models.
2. IF invalid configuration input is provided THEN effect-statsig Monorepo SHALL return typed validation errors.
3. WHILE multiple adapters consume shared configuration THE effect-statsig Monorepo SHALL use one canonical schema definition.
4. WHERE shared package APIs are published THE effect-statsig Monorepo SHALL provide types that are usable in Node, Browser, Edge, and Mobile runtimes.

### Requirement 3: Server Runtime Adapter
**Objective:** As a backend engineer, I want safe Node runtime integration for Statsig, so that I can run flag evaluation and event delivery reliably.

#### Acceptance Criteria
1. WHEN an application initializes `@effect-statsig/node` THEN effect-statsig Monorepo SHALL provide scoped startup and shutdown lifecycle handling.
2. IF gate evaluation is requested during server execution THEN effect-statsig Monorepo SHALL return typed gate evaluation results.
3. WHILE the server process is running THE effect-statsig Monorepo SHALL provide analytics event send and flush operations.
4. WHERE server adapter operations fail THE effect-statsig Monorepo SHALL return errors that identify the failed operation category.

### Requirement 4: Browser and React Adapters
**Objective:** As a frontend engineer, I want Browser and React APIs that follow the same mental model, so that I can reduce client implementation learning time.

#### Acceptance Criteria
1. WHEN an application uses `@effect-statsig/browser` THEN effect-statsig Monorepo SHALL provide evaluation APIs for gates, experiments, and dynamic config.
2. IF a React application uses `@effect-statsig/react` THEN effect-statsig Monorepo SHALL provide a Provider and hook APIs.
3. WHILE the React Provider is mounted THE effect-statsig Monorepo SHALL provide a consistent evaluation context to hooks.
4. WHERE SSR-to-CSR transitions occur THE effect-statsig Monorepo SHALL provide a mechanism to carry initial evaluation state across hydration.

### Requirement 5: Edge and Mobile Adapters
**Objective:** As a platform engineer, I want Cloudflare Workers and Expo support, so that teams can adopt the library across deployment targets.

#### Acceptance Criteria
1. WHEN a developer uses `@effect-statsig/cloudflare` THEN effect-statsig Monorepo SHALL provide initialization behavior compatible with Workers runtime constraints.
2. IF a developer uses `@effect-statsig/expo` THEN effect-statsig Monorepo SHALL provide initialization behavior compatible with React Native runtime constraints.
3. WHILE Edge or Mobile adapters are in use THE effect-statsig Monorepo SHALL preserve compatibility with core service contracts.
4. WHERE runtime-specific documentation is published THE effect-statsig Monorepo SHALL define required environment assumptions and setup steps.

### Requirement 6: Buildtime Flags
**Objective:** As an application engineer, I want to combine buildtime and remote flags, so that I can implement environment-specific control strategies.

#### Acceptance Criteria
1. WHEN a developer uses `@effect-statsig/buildtime` THEN effect-statsig Monorepo SHALL provide inline, env, and JSON flag input sources.
2. IF a developer composes buildtime and remote providers THEN effect-statsig Monorepo SHALL provide deterministic precedence behavior.
3. WHILE build optimization is enabled THE effect-statsig Monorepo SHALL provide usage patterns that allow elimination of buildtime-resolved branches.
4. WHERE buildtime flag documentation is published THE effect-statsig Monorepo SHALL define composition rules and validation steps.

### Requirement 7: Documentation and Samples
**Objective:** As a new adopter, I want package-level guidance and examples, so that I can move from installation to successful usage with low friction.

#### Acceptance Criteria
1. WHEN any package is release-eligible THEN effect-statsig Monorepo SHALL include `packages/<name>/README.md`.
2. IF a package is release-eligible THEN effect-statsig Monorepo SHALL include `docs/packages/<name>.md`.
3. WHILE a package is maintained THE effect-statsig Monorepo SHALL maintain at least one runnable sample for that package.
4. WHERE sample directories are published THE effect-statsig Monorepo SHALL include a sample README with execution steps.

### Requirement 8: Quality Gates and Verification
**Objective:** As a maintainer, I want automated validation for every change, so that I can continuously prevent regressions.

#### Acceptance Criteria
1. WHEN CI runs THEN effect-statsig Monorepo SHALL execute `lint`, `typecheck`, `test`, and `build` jobs.
2. IF core package coverage is measured THEN effect-statsig Monorepo SHALL enforce line coverage of at least 90%.
3. IF adapter package coverage is measured THEN effect-statsig Monorepo SHALL enforce line coverage of at least 80%.
4. WHILE samples are provided THE effect-statsig Monorepo SHALL execute sample smoke verification jobs.

### Requirement 9: Release Management
**Objective:** As a release engineer, I want traceable and predictable publishing, so that users can adopt updates with confidence.

#### Acceptance Criteria
1. WHEN a user-visible change is introduced THEN effect-statsig Monorepo SHALL require a Changesets entry.
2. IF the release pipeline is triggered THEN effect-statsig Monorepo SHALL automate versioning and publish steps.
3. WHILE a release is in progress THE effect-statsig Monorepo SHALL publish only verified artifacts.
4. WHERE root roadmap documentation is published THE effect-statsig Monorepo SHALL identify supported packages and version policy.

### Requirement 10: Effect-First Governance
**Objective:** As an architecture owner, I want consistent design decisions, so that I can reduce long-term maintenance debt.

#### Acceptance Criteria
1. WHEN multiple design options exist THEN effect-statsig Monorepo SHALL prioritize Effect source code practices.
2. IF an adopted design deviates from Effect source code practices THEN effect-statsig Monorepo SHALL record the deviation rationale in change history.
3. WHILE adding new public APIs THE effect-statsig Monorepo SHALL align naming and abstraction choices with Effect conventions.
4. WHERE pull request review criteria are defined THE effect-statsig Monorepo SHALL include Effect-alignment checks.
