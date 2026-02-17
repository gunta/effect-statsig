import { createContext, useContext } from "react"
import {
  AnalyticsService,
  DynamicConfigService,
  ExperimentsService,
  FeatureFlagsService,
  JsonValue
} from "@effect-statsig/core"

export interface HydrationState {
  readonly flags?: Readonly<Record<string, boolean>>
  readonly experiments?: Readonly<Record<string, { readonly variant: string; readonly parameters: Readonly<Record<string, JsonValue>> }>>
  readonly dynamicConfigs?: Readonly<Record<string, Readonly<Record<string, JsonValue>>>>
}

export interface StatsigReactServices {
  readonly featureFlags: FeatureFlagsService
  readonly analytics: AnalyticsService
  readonly experiments: ExperimentsService
  readonly dynamicConfig: DynamicConfigService
  readonly hydration?: HydrationState
}

export const StatsigReactContext = createContext<StatsigReactServices | null>(null)

export const useStatsigServices = (): StatsigReactServices => {
  const value = useContext(StatsigReactContext)
  if (value === null) {
    throw new Error("StatsigProvider is required")
  }
  return value
}
