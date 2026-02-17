import { strict as assert } from "node:assert"
import { Effect } from "effect"
import { NoopFeatureFlagsService } from "../../packages/core/src/index"

const enabled = await Effect.runPromise(NoopFeatureFlagsService.check({ gate: "x" }))
assert.equal(enabled, false)
console.log("core-contracts test passed")
