import { PropsWithChildren } from "react"
import {
  AnalyticsService,
  DynamicConfigService,
  ExperimentsService,
  FeatureFlagsService
} from "@effect-statsig/core"
import { HydrationState, StatsigReactContext } from "./context"

export interface StatsigProviderProps extends PropsWithChildren {
  readonly featureFlags: FeatureFlagsService
  readonly analytics: AnalyticsService
  readonly experiments: ExperimentsService
  readonly dynamicConfig: DynamicConfigService
  readonly hydration?: HydrationState
}

export const StatsigProvider = (props: StatsigProviderProps) => (
  <StatsigReactContext.Provider
    value={{
      featureFlags: props.featureFlags,
      analytics: props.analytics,
      experiments: props.experiments,
      dynamicConfig: props.dynamicConfig,
      hydration: props.hydration
    }}
  >
    {props.children}
  </StatsigReactContext.Provider>
)
