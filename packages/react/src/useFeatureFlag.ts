import { Effect } from "effect"
import { useEffect, useMemo, useState } from "react"
import { useStatsigServices } from "./context"

export interface UseFeatureFlagResult {
  readonly value: boolean
  readonly loading: boolean
  readonly error?: string
}

export const useFeatureFlag = (gate: string): UseFeatureFlagResult => {
  const { featureFlags, hydration } = useStatsigServices()
  const hydratedValue = hydration?.flags?.[gate]
  const [state, setState] = useState<UseFeatureFlagResult>({
    value: hydratedValue ?? false,
    loading: hydratedValue === undefined
  })

  useEffect(() => {
    let active = true
    Effect.runPromise(featureFlags.check({ gate }))
      .then((value) => {
        if (active) {
          setState({ value, loading: false })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ value: false, loading: false, error: String(error) })
        }
      })

    return () => {
      active = false
    }
  }, [featureFlags, gate])

  return useMemo(() => state, [state])
}
