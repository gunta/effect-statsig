import { Effect } from "effect"
import { FeatureFlags } from "../../packages/core/src/index"
import { makeBrowserLayer, BrowserStatsigClient } from "../../packages/browser/src/index"

const client: BrowserStatsigClient = {
  initialize: async () => undefined,
  updateUser: async () => undefined,
  shutdown: async () => undefined,
  checkGate: async (gate) => gate === "from_ssr",
  getExperiment: async (experiment) => ({ name: experiment, variant: "ssr", parameters: {} }),
  getLayer: async (layer) => ({ name: layer, values: {} }),
  getDynamicConfig: async (config) => ({ name: config, values: { hydration: "ok" } }),
  logEvent: async () => undefined,
  flush: async () => undefined
}

const layer = makeBrowserLayer({ client, config: { environment: "prod", clientKey: "public" }, user: { userId: "next-user" } })
const enabled = await Effect.runPromise(
  Effect.scoped(Effect.flatMap(FeatureFlags, (flags) => flags.check({ gate: "from_ssr" })).pipe(Effect.provide(layer)))
)
console.log(`nextjs-app hydrationGate=${enabled}`)
