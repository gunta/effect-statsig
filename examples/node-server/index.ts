import { Effect } from "effect"
import { FeatureFlags } from "../../packages/core/src/index"
import { makeNodeLayer, NodeStatsigClient } from "../../packages/node/src/index"

const client: NodeStatsigClient = {
  initialize: async () => undefined,
  shutdown: async () => undefined,
  checkGate: async (_user, gate) => gate === "enabled",
  getExperiment: async (user, experiment) => ({ name: experiment, variant: user.userId, parameters: {} }),
  getLayer: async (user, layer) => ({ name: layer, values: { user: user.userId } }),
  getDynamicConfig: async (_user, config) => ({ name: config, values: { theme: "light" } }),
  logEvent: async () => undefined,
  flush: async () => undefined
}

const layer = makeNodeLayer({ client, config: { environment: "prod", serverSecretKey: "secret" }, user: { userId: "n-1" } })

const program = Effect.flatMap(FeatureFlags, (flags) => flags.check({ gate: "enabled" })).pipe(Effect.provide(layer))
const enabled = await Effect.runPromise(Effect.scoped(program))
console.log(`node-server enabled=${enabled}`)
