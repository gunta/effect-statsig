import { Effect } from "effect"
import { useEffect, useMemo, useState } from "react"
import { DynamicConfigValue } from "@effect-statsig/core"
import { useStatsigServices } from "./context"

export interface UseDynamicConfigResult {
  readonly value: DynamicConfigValue
  readonly loading: boolean
  readonly error?: string
}

const defaultConfig = (name: string): DynamicConfigValue => ({
  name,
  values: {}
})

export const useDynamicConfig = (config: string): UseDynamicConfigResult => {
  const { dynamicConfig, hydration } = useStatsigServices()
  const hydrated = hydration?.dynamicConfigs?.[config]

  const [state, setState] = useState<UseDynamicConfigResult>({
    value: hydrated ? { name: config, values: hydrated } : defaultConfig(config),
    loading: hydrated === undefined
  })

  useEffect(() => {
    let active = true
    Effect.runPromise(dynamicConfig.get({ config }))
      .then((value) => {
        if (active) {
          setState({ value, loading: false })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ value: defaultConfig(config), loading: false, error: String(error) })
        }
      })

    return () => {
      active = false
    }
  }, [config, dynamicConfig])

  return useMemo(() => state, [state])
}
