import { Effect } from "effect"
import { useEffect, useMemo, useState } from "react"
import { ExperimentValue } from "@effect-statsig/core"
import { useStatsigServices } from "./context"

export interface UseExperimentResult {
  readonly value: ExperimentValue
  readonly loading: boolean
  readonly error?: string
}

const defaultExperiment = (name: string): ExperimentValue => ({
  name,
  variant: "control",
  parameters: {}
})

export const useExperiment = (experiment: string): UseExperimentResult => {
  const { experiments, hydration } = useStatsigServices()
  const hydrated = hydration?.experiments?.[experiment]
  const [state, setState] = useState<UseExperimentResult>({
    value: hydrated
      ? { name: experiment, variant: hydrated.variant, parameters: hydrated.parameters }
      : defaultExperiment(experiment),
    loading: hydrated === undefined
  })

  useEffect(() => {
    let active = true
    Effect.runPromise(experiments.get({ experiment }))
      .then((value) => {
        if (active) {
          setState({ value, loading: false })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ value: defaultExperiment(experiment), loading: false, error: String(error) })
        }
      })

    return () => {
      active = false
    }
  }, [experiment, experiments])

  return useMemo(() => state, [state])
}
