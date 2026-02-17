import { Effect } from "effect"
import { FeatureFlags } from "../../packages/core/src/index"
import { CloudflareStatsigClient, makeCloudflareLayer } from "../../packages/cloudflare/src/index"

const client: CloudflareStatsigClient = {
  initialize: async () => undefined,
  shutdown: async () => undefined,
  checkGate: async () => true,
  getExperiment: async (experiment) => ({ name: experiment, variant: "edge", parameters: {} }),
  getLayer: async (layer) => ({ name: layer, values: {} }),
  getDynamicConfig: async (config) => ({ name: config, values: { region: "edge" } }),
  logEvent: async () => undefined,
  flush: async () => undefined
}

const layer = makeCloudflareLayer({ client, config: { environment: "prod", clientKey: "public" }, user: { userId: "edge-user" } })
const enabled = await Effect.runPromise(
  Effect.scoped(Effect.flatMap(FeatureFlags, (flags) => flags.check({ gate: "edge_gate" })).pipe(Effect.provide(layer)))
)
console.log(`cloudflare-worker enabled=${enabled}`)
