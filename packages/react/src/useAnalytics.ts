import { AnalyticsEvent } from "@effect-statsig/core"
import { useStatsigServices } from "./context"

export interface UseAnalyticsResult {
  readonly logEvent: ReturnType<typeof useStatsigServices>["analytics"]["logEvent"]
  readonly flush: ReturnType<typeof useStatsigServices>["analytics"]["flush"]
  readonly shutdown: ReturnType<typeof useStatsigServices>["analytics"]["shutdown"]
}

export const useAnalytics = (): UseAnalyticsResult => {
  const { analytics } = useStatsigServices()
  return {
    logEvent: (event: AnalyticsEvent) => analytics.logEvent(event),
    flush: analytics.flush,
    shutdown: analytics.shutdown
  }
}
