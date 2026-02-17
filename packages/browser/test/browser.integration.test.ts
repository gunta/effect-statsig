import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { FeatureFlags } from "@effect-statsig/core"
import { BrowserStatsigClient, makeBrowserLayer } from "../src"

describe("browser adapter integration", () => {
  it("initializes and cleans up in scope", async () => {
    const calls: string[] = []
    const client: BrowserStatsigClient = {
      initialize: async () => {
        calls.push("initialize")
      },
      updateUser: async () => undefined,
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

    const layer = makeBrowserLayer({
      client,
      config: { environment: "dev", clientKey: "client-key" },
      user: { userId: "u-1" }
    })

    const program = Effect.flatMap(FeatureFlags, (service) => service.check({ gate: "g" })).pipe(Effect.provide(layer))
    await Effect.runPromise(Effect.scoped(program))

    expect(calls).toEqual(["initialize", "shutdown"])
  })
})
