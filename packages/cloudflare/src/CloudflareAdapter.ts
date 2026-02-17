import { Data, Effect, Layer } from "effect"
import {
  Analytics,
  AnalyticsError,
  AnalyticsEvent,
  AnalyticsService,
  DynamicConfig,
  DynamicConfigError,
  DynamicConfigService,
  DynamicConfigValue,
  ExperimentError,
  ExperimentValue,
  Experiments,
  ExperimentsService,
  FeatureFlagError,
  FeatureFlags,
  FeatureFlagsService,
  LayerValue
} from "@effect-statsig/core"
import { StatsigConfig, StatsigUser } from "@effect-statsig/statsig"

export class CloudflareAdapterError extends Data.TaggedError("CloudflareAdapterError")<{
  readonly operation: string
  readonly cause?: unknown
}> {}

export interface CloudflareStatsigClient {
  readonly initialize: (config: StatsigConfig, user: StatsigUser) => Promise<void>
  readonly shutdown: () => Promise<void>
  readonly checkGate: (gate: string, expose: boolean) => Promise<boolean>
  readonly getExperiment: (experiment: string) => Promise<ExperimentValue>
  readonly getLayer: (layer: string) => Promise<LayerValue>
  readonly getDynamicConfig: (config: string) => Promise<DynamicConfigValue>
  readonly logEvent: (event: AnalyticsEvent) => Promise<void>
  readonly flush: () => Promise<void>
}

const wrap = <A>(operation: string, run: () => Promise<A>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new CloudflareAdapterError({ operation, cause })
  })

export const makeCloudflareServices = (client: CloudflareStatsigClient) => {
  const featureFlags: FeatureFlagsService = {
    check: (input) =>
      wrap("check", () => client.checkGate(input.gate, false)).pipe(
        Effect.mapError((error) => new FeatureFlagError({ reason: error.operation, cause: error.cause }))
      ),
    checkWithExposure: (input) =>
      wrap("checkWithExposure", () => client.checkGate(input.gate, true)).pipe(
        Effect.mapError((error) => new FeatureFlagError({ reason: error.operation, cause: error.cause }))
      )
  }

  const experiments: ExperimentsService = {
    get: (input) =>
      wrap("getExperiment", () => client.getExperiment(input.experiment)).pipe(
        Effect.mapError((error) => new ExperimentError({ reason: error.operation, cause: error.cause }))
      ),
    getLayer: (input) =>
      wrap("getLayer", () => client.getLayer(input.layer)).pipe(
        Effect.mapError((error) => new ExperimentError({ reason: error.operation, cause: error.cause }))
      )
  }

  const dynamicConfig: DynamicConfigService = {
    get: (input) =>
      wrap("getDynamicConfig", () => client.getDynamicConfig(input.config)).pipe(
        Effect.mapError((error) => new DynamicConfigError({ reason: error.operation, cause: error.cause }))
      )
  }

  const analytics: AnalyticsService = {
    logEvent: (event) =>
      wrap("logEvent", () => client.logEvent(event)).pipe(
        Effect.mapError((error) => new AnalyticsError({ reason: error.operation, cause: error.cause }))
      ),
    flush: () =>
      wrap("flush", () => client.flush()).pipe(
        Effect.mapError((error) => new AnalyticsError({ reason: error.operation, cause: error.cause }))
      ),
    shutdown: () =>
      wrap("shutdown", () => client.shutdown()).pipe(
        Effect.mapError((error) => new AnalyticsError({ reason: error.operation, cause: error.cause }))
      )
  }

  return { featureFlags, experiments, dynamicConfig, analytics }
}

export const makeCloudflareLayer = (input: {
  readonly client: CloudflareStatsigClient
  readonly config: StatsigConfig
  readonly user: StatsigUser
}) => {
  const services = makeCloudflareServices(input.client)
  const lifecycle = Layer.scopedDiscard(
    Effect.acquireRelease(
      wrap("initialize", () => input.client.initialize(input.config, input.user)),
      () => wrap("shutdown", () => input.client.shutdown()).pipe(Effect.orDie)
    )
  )

  const serviceLayer = Layer.mergeAll(
    Layer.succeed(FeatureFlags, services.featureFlags),
    Layer.succeed(Experiments, services.experiments),
    Layer.succeed(DynamicConfig, services.dynamicConfig),
    Layer.succeed(Analytics, services.analytics)
  )

  return Layer.provide(serviceLayer, lifecycle)
}
