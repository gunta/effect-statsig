import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { FeatureFlags } from "@effect-statsig/core"
import { makeNodeLayer, NodeStatsigClient } from "../src"

describe("node adapter integration", () => {
  it("initializes and tears down per scope", async () => {
    const calls: string[] = []
    const client: NodeStatsigClient = {
      initialize: async () => {
        calls.push("initialize")
      },
      shutdown: async () => {
        calls.push("shutdown")
      },
      checkGate: async () => true,
      getExperiment: async () => ({ name: "exp", variant: "control", parameters: {} }),
      getLayer: async () => ({ name: "layer", values: {} }),
      getDynamicConfig: async () => ({ name: "cfg", values: {} }),
      logEvent: async () => undefined,
      flush: async () => undefined
    }

    const layer = makeNodeLayer({
      client,
      config: { environment: "test", serverSecretKey: "secret" },
      user: { userId: "u-1" }
    })

    const program = Effect.flatMap(FeatureFlags, (service) => service.check({ gate: "gate" })).pipe(Effect.provide(layer))
    await Effect.runPromise(Effect.scoped(program))

    expect(calls[0]).toBe("initialize")
    expect(calls[calls.length - 1]).toBe("shutdown")
  })
})
