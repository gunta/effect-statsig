import { strict as assert } from "node:assert"
import { Effect } from "effect"
import { FeatureFlags } from "../../packages/core/src/index"
import { makeBrowserLayer, BrowserStatsigClient } from "../../packages/browser/src/index"

const client: BrowserStatsigClient = {
  initialize: async () => undefined,
  updateUser: async () => undefined,
  shutdown: async () => undefined,
  checkGate: async () => true,
  getExperiment: async () => ({ name: "exp", variant: "spa", parameters: {} }),
  getLayer: async () => ({ name: "layer", values: {} }),
  getDynamicConfig: async () => ({ name: "cfg", values: {} }),
  logEvent: async () => undefined,
  flush: async () => undefined
}

const layer = makeBrowserLayer({ client, config: { environment: "dev", clientKey: "public" }, user: { userId: "web-u" } })
const enabled = await Effect.runPromise(
  Effect.scoped(Effect.flatMap(FeatureFlags, (flags) => flags.check({ gate: "g" })).pipe(Effect.provide(layer)))
)
assert.equal(enabled, true)
console.log("react-spa test passed")
