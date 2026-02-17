import { Data } from "effect"

export class FeatureFlagError extends Data.TaggedError("FeatureFlagError")<{
  readonly reason: string
  readonly cause?: unknown
}> {}

export class AnalyticsError extends Data.TaggedError("AnalyticsError")<{
  readonly reason: string
  readonly cause?: unknown
}> {}

export class ExperimentError extends Data.TaggedError("ExperimentError")<{
  readonly reason: string
  readonly cause?: unknown
}> {}

export class DynamicConfigError extends Data.TaggedError("DynamicConfigError")<{
  readonly reason: string
  readonly cause?: unknown
}> {}
