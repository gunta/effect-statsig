import { describe, expect, it } from "vitest"
import { Effect, Layer } from "effect"
import { Analytics, DynamicConfig, Experiments, FeatureFlags } from "@effect-statsig/core"
import { composeFeatureFlags } from "../src"
import { makeNodeServices, NodeStatsigClient } from "@effect-statsig/node"
import { BrowserStatsigClient, makeBrowserServices } from "@effect-statsig/browser"

describe("buildtime mixed integration", () => {
  it("composes buildtime flags with node services while preserving other node behaviors", async () => {
    const calls: string[] = []
    const nodeClient: NodeStatsigClient = {
      initialize: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async (_user, gate, expose) => {
        calls.push(`check:${gate}:${String(expose)}`)
        if (gate === "local_only") {
          throw new Error("remote unavailable")
        }
        return gate === "remote_only"
      },
      getExperiment: async (_user, experiment) => ({ name: experiment, variant: "node-variant", parameters: {} }),
      getLayer: async (_user, layer) => ({ name: layer, values: { source: "node" } }),
      getDynamicConfig: async (_user, config) => ({ name: config, values: { color: "blue" } }),
      logEvent: async () => {
        calls.push("logEvent")
      },
      flush: async () => {
        calls.push("flush")
      }
    }

    const nodeServices = makeNodeServices(nodeClient, { userId: "u-1" })
    const composedFlags = composeFeatureFlags({ local_only: true }, nodeServices.featureFlags, "remote-first")

    const mixedLayer = Layer.mergeAll(
      Layer.succeed(FeatureFlags, composedFlags),
      Layer.succeed(Experiments, nodeServices.experiments),
      Layer.succeed(DynamicConfig, nodeServices.dynamicConfig),
      Layer.succeed(Analytics, nodeServices.analytics)
    )

    const program = Effect.gen(function* () {
      const flags = yield* FeatureFlags
      const experiments = yield* Experiments
      const dynamicConfig = yield* DynamicConfig
      const analytics = yield* Analytics

      const local = yield* flags.check({ gate: "local_only" })
      const remote = yield* flags.checkWithExposure({ gate: "remote_only" })
      const experiment = yield* experiments.get({ experiment: "checkout" })
      const layer = yield* experiments.getLayer({ layer: "copy" })
      const config = yield* dynamicConfig.get({ config: "homepage" })
      yield* analytics.logEvent({ name: "mixed_seen", user: { userId: "u-1" } })
      yield* analytics.flush()

      return { local, remote, experiment, layer, config }
    }).pipe(Effect.provide(mixedLayer))

    const result = await Effect.runPromise(program)

    expect(result.local).toBe(true)
    expect(result.remote).toBe(true)
    expect(result.experiment.variant).toBe("node-variant")
    expect(result.layer.values.source).toBe("node")
    expect(result.config.values.color).toBe("blue")
    expect(calls).toContain("check:local_only:false")
    expect(calls).toContain("check:remote_only:true")
    expect(calls).toContain("logEvent")
    expect(calls).toContain("flush")
  })

  it("composes buildtime flags with browser services and bypasses remote checks for local winners", async () => {
    const calls: string[] = []
    const browserClient: BrowserStatsigClient = {
      initialize: async () => undefined,
      updateUser: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async (gate, expose) => {
        calls.push(`check:${gate}:${String(expose)}`)
        return gate === "remote_gate"
      },
      getExperiment: async (experiment) => ({ name: experiment, variant: "browser-variant", parameters: {} }),
      getLayer: async (layer) => ({ name: layer, values: { source: "browser" } }),
      getDynamicConfig: async (config) => ({ name: config, values: { color: "green" } }),
      logEvent: async () => {
        calls.push("logEvent")
      },
      flush: async () => {
        calls.push("flush")
      }
    }

    const browserServices = makeBrowserServices(browserClient)
    const composedFlags = composeFeatureFlags(
      { buildtime_kill_switch: true, remote_gate: false },
      browserServices.featureFlags,
      "buildtime-first"
    )

    const mixedLayer = Layer.mergeAll(
      Layer.succeed(FeatureFlags, composedFlags),
      Layer.succeed(Experiments, browserServices.experiments),
      Layer.succeed(DynamicConfig, browserServices.dynamicConfig),
      Layer.succeed(Analytics, browserServices.analytics)
    )

    const program = Effect.gen(function* () {
      const flags = yield* FeatureFlags
      const experiments = yield* Experiments
      const dynamicConfig = yield* DynamicConfig
      const analytics = yield* Analytics

      const killSwitch = yield* flags.check({ gate: "buildtime_kill_switch" })
      const remoteGate = yield* flags.checkWithExposure({ gate: "remote_gate" })
      const experiment = yield* experiments.get({ experiment: "checkout" })
      const config = yield* dynamicConfig.get({ config: "homepage" })
      yield* analytics.logEvent({ name: "browser_mixed", user: { userId: "u-1" } })
      yield* analytics.flush()
      return { killSwitch, remoteGate, experiment, config }
    }).pipe(Effect.provide(mixedLayer))

    const result = await Effect.runPromise(program)

    expect(result.killSwitch).toBe(true)
    expect(result.remoteGate).toBe(false)
    expect(result.experiment.variant).toBe("browser-variant")
    expect(result.config.values.color).toBe("green")
    expect(calls).not.toContain("check:buildtime_kill_switch:false")
    expect(calls).not.toContain("check:remote_gate:true")
    expect(calls).toContain("logEvent")
    expect(calls).toContain("flush")
  })
})
