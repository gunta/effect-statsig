import { describe, expect, it } from "vitest"
import { Either, Effect } from "effect"
import { Analytics, DynamicConfig, Experiments, FeatureFlags } from "@effect-statsig/core"
import { makeBrowserLayer, BrowserStatsigClient, updateBrowserUser } from "@effect-statsig/browser"
import { makeCloudflareLayer, CloudflareStatsigClient } from "@effect-statsig/cloudflare"
import { makeExpoLayer, ExpoStatsigClient, updateExpoUser } from "@effect-statsig/expo"
import { makeNodeLayer, NodeStatsigClient } from "@effect-statsig/node"
import { parseStatsigConfig, parseStatsigUser, StatsigConfig, StatsigUser } from "@effect-statsig/statsig"

const decodeOrThrow = <A>(value: Either.Either<A, Error>): A => {
  if (Either.isLeft(value)) {
    throw value.left
  }
  return value.right
}

const makeProgram = () =>
  Effect.gen(function* () {
    const flags = yield* FeatureFlags
    const experiments = yield* Experiments
    const dynamicConfig = yield* DynamicConfig
    const analytics = yield* Analytics

    const enabled = yield* flags.check({ gate: "checkout_gate" })
    const exposed = yield* flags.checkWithExposure({ gate: "checkout_gate" })
    const experiment = yield* experiments.get({ experiment: "checkout" })
    const layer = yield* experiments.getLayer({ layer: "site_copy" })
    const config = yield* dynamicConfig.get({ config: "homepage" })
    yield* analytics.logEvent({ name: "checkout_viewed", user: { userId: "u-1" } })
    yield* analytics.flush()
    yield* analytics.shutdown()

    return {
      enabled,
      exposed,
      experimentVariant: experiment.variant,
      layerLocale: String(layer.values.locale),
      heroColor: String(config.values.color)
    }
  })

describe("runtime e2e parity", () => {
  it("keeps core behavior consistent across node browser cloudflare and expo adapters", async () => {
    const config: StatsigConfig = decodeOrThrow(
      parseStatsigConfig({
        environment: "prod",
        serverSecretKey: "secret-key",
        clientKey: "client-key"
      })
    )
    const user: StatsigUser = decodeOrThrow(parseStatsigUser({ userId: "u-1", country: "US" }))
    const nextUser: StatsigUser = decodeOrThrow(parseStatsigUser({ userId: "u-2", country: "DE" }))

    const nodeCalls: string[] = []
    const browserCalls: string[] = []
    const cloudflareCalls: string[] = []
    const expoCalls: string[] = []

    const nodeClient: NodeStatsigClient = {
      initialize: async () => {
        nodeCalls.push("initialize")
      },
      shutdown: async () => {
        nodeCalls.push("shutdown")
      },
      checkGate: async (_user, gate, expose) => {
        nodeCalls.push(`check:${gate}:${String(expose)}`)
        return gate === "checkout_gate"
      },
      getExperiment: async (effectiveUser, experiment) => ({
        name: `${experiment}-${effectiveUser.userId}`,
        variant: "treatment",
        parameters: {}
      }),
      getLayer: async () => ({ name: "site_copy", values: { locale: "en-US" } }),
      getDynamicConfig: async () => ({ name: "homepage", values: { color: "blue" } }),
      logEvent: async () => {
        nodeCalls.push("logEvent")
      },
      flush: async () => {
        nodeCalls.push("flush")
      }
    }

    const browserClient: BrowserStatsigClient = {
      initialize: async () => {
        browserCalls.push("initialize")
      },
      updateUser: async (effectiveUser) => {
        browserCalls.push(`updateUser:${effectiveUser.userId}`)
      },
      shutdown: async () => {
        browserCalls.push("shutdown")
      },
      checkGate: async (gate, expose) => {
        browserCalls.push(`check:${gate}:${String(expose)}`)
        return gate === "checkout_gate"
      },
      getExperiment: async () => ({ name: "checkout-u-1", variant: "treatment", parameters: {} }),
      getLayer: async () => ({ name: "site_copy", values: { locale: "en-US" } }),
      getDynamicConfig: async () => ({ name: "homepage", values: { color: "blue" } }),
      logEvent: async () => {
        browserCalls.push("logEvent")
      },
      flush: async () => {
        browserCalls.push("flush")
      }
    }

    const cloudflareClient: CloudflareStatsigClient = {
      initialize: async () => {
        cloudflareCalls.push("initialize")
      },
      shutdown: async () => {
        cloudflareCalls.push("shutdown")
      },
      checkGate: async (gate, expose) => {
        cloudflareCalls.push(`check:${gate}:${String(expose)}`)
        return gate === "checkout_gate"
      },
      getExperiment: async () => ({ name: "checkout-u-1", variant: "treatment", parameters: {} }),
      getLayer: async () => ({ name: "site_copy", values: { locale: "en-US" } }),
      getDynamicConfig: async () => ({ name: "homepage", values: { color: "blue" } }),
      logEvent: async () => {
        cloudflareCalls.push("logEvent")
      },
      flush: async () => {
        cloudflareCalls.push("flush")
      }
    }

    const expoClient: ExpoStatsigClient = {
      initialize: async () => {
        expoCalls.push("initialize")
      },
      updateUser: async (effectiveUser) => {
        expoCalls.push(`updateUser:${effectiveUser.userId}`)
      },
      shutdown: async () => {
        expoCalls.push("shutdown")
      },
      checkGate: async (gate, expose) => {
        expoCalls.push(`check:${gate}:${String(expose)}`)
        return gate === "checkout_gate"
      },
      getExperiment: async () => ({ name: "checkout-u-1", variant: "treatment", parameters: {} }),
      getLayer: async () => ({ name: "site_copy", values: { locale: "en-US" } }),
      getDynamicConfig: async () => ({ name: "homepage", values: { color: "blue" } }),
      logEvent: async () => {
        expoCalls.push("logEvent")
      },
      flush: async () => {
        expoCalls.push("flush")
      }
    }

    const nodeLayer = makeNodeLayer({ client: nodeClient, config, user })
    const browserLayer = makeBrowserLayer({ client: browserClient, config, user })
    const cloudflareLayer = makeCloudflareLayer({ client: cloudflareClient, config, user })
    const expoLayer = makeExpoLayer({ client: expoClient, config, user })

    const nodeResult = await Effect.runPromise(Effect.scoped(makeProgram().pipe(Effect.provide(nodeLayer))))
    const browserResult = await Effect.runPromise(Effect.scoped(makeProgram().pipe(Effect.provide(browserLayer))))
    const cloudflareResult = await Effect.runPromise(Effect.scoped(makeProgram().pipe(Effect.provide(cloudflareLayer))))
    const expoResult = await Effect.runPromise(Effect.scoped(makeProgram().pipe(Effect.provide(expoLayer))))

    await Effect.runPromise(updateBrowserUser(browserClient, nextUser))
    await Effect.runPromise(updateExpoUser(expoClient, nextUser))

    expect(nodeResult).toEqual(browserResult)
    expect(nodeResult).toEqual(cloudflareResult)
    expect(nodeResult).toEqual(expoResult)

    expect(nodeCalls).toContain("initialize")
    expect(nodeCalls).toContain("shutdown")
    expect(browserCalls).toContain("updateUser:u-2")
    expect(cloudflareCalls).toContain("initialize")
    expect(cloudflareCalls).toContain("shutdown")
    expect(expoCalls).toContain("updateUser:u-2")
  })
})
