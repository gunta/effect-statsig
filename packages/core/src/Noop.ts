import { Effect, Layer } from "effect"
import { Analytics, AnalyticsService } from "./Analytics"
import { DynamicConfig, DynamicConfigService } from "./DynamicConfig"
import { FeatureFlags, FeatureFlagsService } from "./FeatureFlags"
import { Experiments, ExperimentsService } from "./Experiments"

export const NoopFeatureFlagsService: FeatureFlagsService = {
  check: () => Effect.succeed(false),
  checkWithExposure: () => Effect.succeed(false)
}

export const NoopAnalyticsService: AnalyticsService = {
  logEvent: () => Effect.void,
  flush: () => Effect.void,
  shutdown: () => Effect.void
}

export const NoopExperimentsService: ExperimentsService = {
  get: (input) => Effect.succeed({ name: input.experiment, variant: "control", parameters: {} }),
  getLayer: (input) => Effect.succeed({ name: input.layer, values: {} })
}

export const NoopDynamicConfigService: DynamicConfigService = {
  get: (input) => Effect.succeed({ name: input.config, values: {} })
}

export const NoopFeatureFlagsLayer = Layer.succeed(FeatureFlags, NoopFeatureFlagsService)
export const NoopAnalyticsLayer = Layer.succeed(Analytics, NoopAnalyticsService)
export const NoopExperimentsLayer = Layer.succeed(Experiments, NoopExperimentsService)
export const NoopDynamicConfigLayer = Layer.succeed(DynamicConfig, NoopDynamicConfigService)
