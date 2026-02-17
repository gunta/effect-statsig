import { Context, Effect } from "effect"
import { FeatureFlagError } from "./errors"

export interface FeatureFlagsService {
  readonly check: (input: { readonly gate: string }) => Effect.Effect<boolean, FeatureFlagError>
  readonly checkWithExposure: (input: { readonly gate: string }) => Effect.Effect<boolean, FeatureFlagError>
}

export class FeatureFlags extends Context.Tag("@effect-statsig/core/FeatureFlags")<FeatureFlags, FeatureFlagsService>() {}
