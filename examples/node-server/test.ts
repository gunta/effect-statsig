import { strict as assert } from "node:assert"
import { Effect } from "effect"
import { FeatureFlags } from "../../packages/core/src/index"
import { makeNodeLayer, NodeStatsigClient } from "../../packages/node/src/index"

const client: NodeStatsigClient = {
  initialize: async () => undefined,
  shutdown: async () => undefined,
  checkGate: async () => true,
  getExperiment: async () => ({ name: "exp", variant: "a", parameters: {} }),
  getLayer: async () => ({ name: "layer", values: {} }),
  getDynamicConfig: async () => ({ name: "cfg", values: {} }),
  logEvent: async () => undefined,
  flush: async () => undefined
}

const layer = makeNodeLayer({ client, config: { environment: "prod", serverSecretKey: "secret" }, user: { userId: "n-1" } })
const enabled = await Effect.runPromise(
  Effect.scoped(Effect.flatMap(FeatureFlags, (flags) => flags.check({ gate: "on" })).pipe(Effect.provide(layer)))
)
assert.equal(enabled, true)
console.log("node-server test passed")
