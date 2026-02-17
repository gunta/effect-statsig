import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { FeatureFlags } from "@effect-statsig/core"
import { ExpoStatsigClient, makeExpoLayer } from "../src"

describe("expo adapter integration", () => {
  it("preserves core service compatibility", async () => {
    const client: ExpoStatsigClient = {
      initialize: async () => undefined,
      updateUser: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async () => true,
      getExperiment: async () => ({ name: "exp", variant: "control", parameters: {} }),
      getLayer: async () => ({ name: "layer", values: {} }),
      getDynamicConfig: async () => ({ name: "cfg", values: {} }),
      logEvent: async () => undefined,
      flush: async () => undefined
    }

    const layer = makeExpoLayer({
      client,
      config: { environment: "prod", clientKey: "mobile-client" },
      user: { userId: "mobile-user" }
    })

    const result = await Effect.runPromise(
      Effect.scoped(Effect.flatMap(FeatureFlags, (service) => service.checkWithExposure({ gate: "gate" })).pipe(Effect.provide(layer)))
    )

    expect(result).toBe(true)
  })
})
