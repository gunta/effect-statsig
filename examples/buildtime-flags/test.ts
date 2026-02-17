import { strict as assert } from "node:assert"
import { Effect } from "effect"
import { composeFeatureFlags } from "../../packages/buildtime/src/index"

const remote = {
  check: () => Effect.succeed(false),
  checkWithExposure: () => Effect.succeed(false)
}

const composed = composeFeatureFlags({ gate_a: true }, remote, "buildtime-first")
const enabled = await Effect.runPromise(composed.check({ gate: "gate_a" }))
assert.equal(enabled, true)
console.log("buildtime-flags test passed")
