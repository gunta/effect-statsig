import { Context, Effect } from "effect"
import { AnalyticsError } from "./errors"
import { AnalyticsEvent } from "./types"

export interface AnalyticsService {
  readonly logEvent: (event: AnalyticsEvent) => Effect.Effect<void, AnalyticsError>
  readonly flush: () => Effect.Effect<void, AnalyticsError>
  readonly shutdown: () => Effect.Effect<void, AnalyticsError>
}

export class Analytics extends Context.Tag("@effect-statsig/core/Analytics")<Analytics, AnalyticsService>() {}
