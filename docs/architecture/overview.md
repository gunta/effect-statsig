# Architecture Overview

The monorepo separates provider-agnostic contracts from provider-specific implementations.

- `core` defines service contracts and typed errors.
- `statsig` defines shared config and user models.
- runtime adapters map contracts to environment-specific clients.
- `buildtime` enables deterministic compile-time and composed flag behavior.
