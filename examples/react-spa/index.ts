import { Effect } from "effect"
import { makeBrowserLayer, BrowserStatsigClient } from "../../packages/browser/src/index"
import { FeatureFlags } from "../../packages/core/src/index"

const client: BrowserStatsigClient = {
  initialize: async () => undefined,
  updateUser: async () => undefined,
  shutdown: async () => undefined,
  checkGate: async (gate) => gate === "enabled",
  getExperiment: async (experiment) => ({ name: experiment, variant: "spa", parameters: {} }),
  getLayer: async (layer) => ({ name: layer, values: {} }),
  getDynamicConfig: async (config) => ({ name: config, values: { layout: "cards" } }),
  logEvent: async () => undefined,
  flush: async () => undefined
}

const layer = makeBrowserLayer({ client, config: { environment: "dev", clientKey: "public" }, user: { userId: "web-u" } })
const enabled = await Effect.runPromise(
  Effect.scoped(Effect.flatMap(FeatureFlags, (flags) => flags.check({ gate: "enabled" })).pipe(Effect.provide(layer)))
)
console.log(`react-spa enabled=${enabled}`)
