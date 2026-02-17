import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { Analytics, DynamicConfig, Experiments, FeatureFlags } from "@effect-statsig/core"
import { makeNodeLayer, makeNodeServices, NodeStatsigClient } from "../src"

const makeClient = () => {
  const calls: string[] = []
  const client: NodeStatsigClient = {
    initialize: async () => {
      calls.push("initialize")
    },
    shutdown: async () => {
      calls.push("shutdown")
    },
    checkGate: async (_user, gate, expose) => {
      calls.push(expose ? "checkWithExposure" : "check")
      return gate === "enabled"
    },
    getExperiment: async (_user, experiment) => ({ name: experiment, variant: "a", parameters: {} }),
    getLayer: async (_user, layer) => ({ name: layer, values: {} }),
    getDynamicConfig: async (_user, config) => ({ name: config, values: {} }),
    logEvent: async () => {
      calls.push("logEvent")
    },
    flush: async () => {
      calls.push("flush")
    }
  }
  return { client, calls }
}

describe("node adapter", () => {
  it("evaluates gate and logs event", async () => {
    const { client, calls } = makeClient()
    const layer = makeNodeLayer({
      client,
      config: { environment: "test", serverSecretKey: "secret" },
      user: { userId: "u-1" }
    })

    const program = Effect.gen(function* () {
      const flags = yield* FeatureFlags
      const analytics = yield* Analytics
      const experiments = yield* Experiments
      const dynamicConfig = yield* DynamicConfig
      const enabled = yield* flags.check({ gate: "enabled" })
      const exposed = yield* flags.checkWithExposure({ gate: "enabled" })
      const experiment = yield* experiments.get({ experiment: "checkout" })
      const layerResult = yield* experiments.getLayer({ layer: "layer" })
      const config = yield* dynamicConfig.get({ config: "homepage" })
      yield* analytics.logEvent({ name: "seen", user: { userId: "u-1" } })
      yield* analytics.flush()
      yield* analytics.shutdown()
      return { enabled, exposed, experiment, layerResult, config }
    }).pipe(Effect.provide(layer))

    const result = await Effect.runPromise(Effect.scoped(program))

    expect(result.enabled).toBe(true)
    expect(result.exposed).toBe(true)
    expect(result.experiment.name).toBe("checkout")
    expect(result.layerResult.name).toBe("layer")
    expect(result.config.name).toBe("homepage")
    expect(calls).toContain("initialize")
    expect(calls).toContain("check")
    expect(calls).toContain("checkWithExposure")
    expect(calls).toContain("logEvent")
    expect(calls).toContain("flush")
    expect(calls).toContain("shutdown")
  })

  it("maps client failures into typed core errors", async () => {
    const client: NodeStatsigClient = {
      initialize: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async () => {
        throw new Error("gate failed")
      },
      getExperiment: async () => {
        throw new Error("experiment failed")
      },
      getLayer: async () => {
        throw new Error("layer failed")
      },
      getDynamicConfig: async () => {
        throw new Error("config failed")
      },
      logEvent: async () => {
        throw new Error("event failed")
      },
      flush: async () => {
        throw new Error("flush failed")
      }
    }

    const layer = makeNodeLayer({
      client,
      config: { environment: "test", serverSecretKey: "secret" },
      user: { userId: "u-1" }
    })

    const program = Effect.flatMap(FeatureFlags, (service) => service.check({ gate: "enabled" })).pipe(Effect.provide(layer))
    const result = await Effect.runPromiseExit(Effect.scoped(program))
    expect(result._tag).toBe("Failure")
  })

  it("maps each node operation to the correct core error reason", async () => {
    const client: NodeStatsigClient = {
      initialize: async () => undefined,
      shutdown: async () => {
        throw new Error("shutdown failed")
      },
      checkGate: async (_user, _gate, expose) => {
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

    const services = makeNodeServices(client, { userId: "u-1" })

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
