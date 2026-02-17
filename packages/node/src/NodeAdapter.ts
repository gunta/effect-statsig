import { Layer, Effect } from "effect"
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
import { Data } from "effect"

export class NodeAdapterError extends Data.TaggedError("NodeAdapterError")<{
  readonly operation: string
  readonly cause?: unknown
}> {}

export interface NodeStatsigClient {
  readonly initialize: (config: StatsigConfig) => Promise<void>
  readonly shutdown: () => Promise<void>
  readonly checkGate: (user: StatsigUser, gate: string, expose: boolean) => Promise<boolean>
  readonly getExperiment: (user: StatsigUser, experiment: string) => Promise<ExperimentValue>
  readonly getLayer: (user: StatsigUser, layer: string) => Promise<LayerValue>
  readonly getDynamicConfig: (user: StatsigUser, config: string) => Promise<DynamicConfigValue>
  readonly logEvent: (event: AnalyticsEvent) => Promise<void>
  readonly flush: () => Promise<void>
}

const wrap = <A>(operation: string, run: () => Promise<A>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new NodeAdapterError({ operation, cause })
  })

export const makeNodeServices = (client: NodeStatsigClient, user: StatsigUser) => {
  const featureFlags: FeatureFlagsService = {
    check: (input) =>
      wrap("check", () => client.checkGate(user, input.gate, false)).pipe(
        Effect.mapError((error) => new FeatureFlagError({ reason: error.operation, cause: error.cause }))
      ),
    checkWithExposure: (input) =>
      wrap("checkWithExposure", () => client.checkGate(user, input.gate, true)).pipe(
        Effect.mapError((error) => new FeatureFlagError({ reason: error.operation, cause: error.cause }))
      )
  }

  const experiments: ExperimentsService = {
    get: (input) =>
      wrap("getExperiment", () => client.getExperiment(user, input.experiment)).pipe(
        Effect.mapError((error) => new ExperimentError({ reason: error.operation, cause: error.cause }))
      ),
    getLayer: (input) =>
      wrap("getLayer", () => client.getLayer(user, input.layer)).pipe(
        Effect.mapError((error) => new ExperimentError({ reason: error.operation, cause: error.cause }))
      )
  }

  const dynamicConfig: DynamicConfigService = {
    get: (input) =>
      wrap("getDynamicConfig", () => client.getDynamicConfig(user, input.config)).pipe(
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

export const makeNodeLayer = (input: {
  readonly client: NodeStatsigClient
  readonly config: StatsigConfig
  readonly user: StatsigUser
}) => {
  const services = makeNodeServices(input.client, input.user)
  const lifecycle = Layer.scopedDiscard(
    Effect.acquireRelease(
      wrap("initialize", () => input.client.initialize(input.config)),
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
