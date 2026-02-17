import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { FeatureFlags } from "@effect-statsig/core"
import { CloudflareStatsigClient, makeCloudflareLayer } from "../src"

describe("cloudflare adapter integration", () => {
  it("keeps contract compatibility with core services", async () => {
    const client: CloudflareStatsigClient = {
      initialize: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async () => true,
      getExperiment: async () => ({ name: "exp", variant: "a", parameters: {} }),
      getLayer: async () => ({ name: "layer", values: {} }),
      getDynamicConfig: async () => ({ name: "cfg", values: {} }),
      logEvent: async () => undefined,
      flush: async () => undefined
    }

    const layer = makeCloudflareLayer({
      client,
      config: { environment: "prod", clientKey: "public-key" },
      user: { userId: "worker-user" }
    })

    const result = await Effect.runPromise(
      Effect.scoped(Effect.flatMap(FeatureFlags, (service) => service.checkWithExposure({ gate: "exposed" })).pipe(Effect.provide(layer)))
    )

    expect(result).toBe(true)
  })
})
