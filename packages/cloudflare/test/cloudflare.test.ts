import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { Analytics, DynamicConfig, Experiments, FeatureFlags } from "@effect-statsig/core"
import { CloudflareStatsigClient, makeCloudflareLayer, makeCloudflareServices } from "../src"

describe("cloudflare adapter", () => {
  it("supports worker-friendly scoped lifecycle", async () => {
    const calls: string[] = []
    const client: CloudflareStatsigClient = {
      initialize: async () => {
        calls.push("initialize")
      },
      shutdown: async () => {
        calls.push("shutdown")
      },
      checkGate: async (gate) => {
        calls.push(`check:${gate}`)
        return true
      },
      getExperiment: async (experiment) => ({ name: experiment, variant: "control", parameters: {} }),
      getLayer: async (layer) => ({ name: layer, values: {} }),
      getDynamicConfig: async (config) => ({ name: config, values: {} }),
      logEvent: async () => undefined,
      flush: async () => undefined
    }

    const layer = makeCloudflareLayer({
      client,
      config: { environment: "prod", clientKey: "public-key" },
      user: { userId: "worker-user" }
    })

    const program = Effect.gen(function* () {
      const flags = yield* FeatureFlags
      const experiments = yield* Experiments
      const dynamicConfig = yield* DynamicConfig
      const analytics = yield* Analytics
      const enabled = yield* flags.check({ gate: "worker_gate" })
      const exposed = yield* flags.checkWithExposure({ gate: "worker_gate" })
      const experiment = yield* experiments.get({ experiment: "exp" })
      const layerResult = yield* experiments.getLayer({ layer: "layer" })
      const config = yield* dynamicConfig.get({ config: "cfg" })
      yield* analytics.logEvent({ name: "edge", user: { userId: "worker-user" } })
      yield* analytics.flush()
      yield* analytics.shutdown()
      return { enabled, exposed, experiment, layerResult, config }
    }).pipe(Effect.provide(layer))

    const result = await Effect.runPromise(Effect.scoped(program))
    expect(result.enabled).toBe(true)
    expect(result.exposed).toBe(true)
    expect(result.experiment.name).toBe("exp")
    expect(result.layerResult.name).toBe("layer")
    expect(result.config.name).toBe("cfg")
    expect(calls).toContain("initialize")
    expect(calls).toContain("check:worker_gate")
    expect(calls).toContain("shutdown")
  })

  it("maps cloudflare client failures into effect failures", async () => {
    const client: CloudflareStatsigClient = {
      initialize: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async () => {
        throw new Error("failed")
      },
      getExperiment: async () => {
        throw new Error("failed")
      },
      getLayer: async () => {
        throw new Error("failed")
      },
      getDynamicConfig: async () => {
        throw new Error("failed")
      },
      logEvent: async () => {
        throw new Error("failed")
      },
      flush: async () => {
        throw new Error("failed")
      }
    }

    const layer = makeCloudflareLayer({
      client,
      config: { environment: "prod", clientKey: "public-key" },
      user: { userId: "worker-user" }
    })

    const program = Effect.flatMap(FeatureFlags, (service) => service.check({ gate: "worker_gate" })).pipe(Effect.provide(layer))
    const result = await Effect.runPromiseExit(Effect.scoped(program))
    expect(result._tag).toBe("Failure")
  })

  it("maps each cloudflare operation to the correct core error reason", async () => {
    const client: CloudflareStatsigClient = {
      initialize: async () => undefined,
      shutdown: async () => {
        throw new Error("shutdown failed")
      },
      checkGate: async (_gate, expose) => {
        throw new Error(expose ? "checkWithExposure failed" : "check failed")
      },
      getExperiment: async () => {
        throw new Error("getExperiment failed")
      },
      getLayer: async () => {
        throw new Error("getLayer failed")
      },
      getDynamicConfig: async () => {
        throw new Error("getDynamicConfig failed")
      },
      logEvent: async () => {
        throw new Error("logEvent failed")
      },
      flush: async () => {
        throw new Error("flush failed")
      }
    }

    const services = makeCloudflareServices(client)

    const checkError = await Effect.runPromise(Effect.flip(services.featureFlags.check({ gate: "checkout" })))
    const exposureError = await Effect.runPromise(Effect.flip(services.featureFlags.checkWithExposure({ gate: "checkout" })))
    const experimentError = await Effect.runPromise(Effect.flip(services.experiments.get({ experiment: "checkout" })))
    const layerError = await Effect.runPromise(Effect.flip(services.experiments.getLayer({ layer: "copy" })))
    const configError = await Effect.runPromise(Effect.flip(services.dynamicConfig.get({ config: "homepage" })))
    const logEventError = await Effect.runPromise(
      Effect.flip(services.analytics.logEvent({ name: "seen", user: { userId: "u-1" } }))
    )
    const flushError = await Effect.runPromise(Effect.flip(services.analytics.flush()))
    const shutdownError = await Effect.runPromise(Effect.flip(services.analytics.shutdown()))

    expect(checkError.reason).toBe("check")
    expect(exposureError.reason).toBe("checkWithExposure")
    expect(experimentError.reason).toBe("getExperiment")
    expect(layerError.reason).toBe("getLayer")
    expect(configError.reason).toBe("getDynamicConfig")
    expect(logEventError.reason).toBe("logEvent")
    expect(flushError.reason).toBe("flush")
    expect(shutdownError.reason).toBe("shutdown")
  })
})
