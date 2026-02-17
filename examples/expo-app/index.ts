import { Effect } from "effect"
import { FeatureFlags } from "../../packages/core/src/index"
import { ExpoStatsigClient, makeExpoLayer } from "../../packages/expo/src/index"

const client: ExpoStatsigClient = {
  initialize: async () => undefined,
  updateUser: async () => undefined,
  shutdown: async () => undefined,
  checkGate: async () => true,
  getExperiment: async (experiment) => ({ name: experiment, variant: "mobile", parameters: {} }),
  getLayer: async (layer) => ({ name: layer, values: {} }),
  getDynamicConfig: async (config) => ({ name: config, values: { platform: "expo" } }),
  logEvent: async () => undefined,
  flush: async () => undefined
}

const layer = makeExpoLayer({ client, config: { environment: "prod", clientKey: "mobile" }, user: { userId: "m-1" } })
const enabled = await Effect.runPromise(
  Effect.scoped(Effect.flatMap(FeatureFlags, (flags) => flags.check({ gate: "mobile_gate" })).pipe(Effect.provide(layer)))
)
console.log(`expo-app enabled=${enabled}`)
