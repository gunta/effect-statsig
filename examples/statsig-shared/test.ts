import { strict as assert } from "node:assert"
import { Either } from "effect"
import { parseStatsigConfig } from "../../packages/statsig/src/index"

const result = parseStatsigConfig({ environment: "dev" })
assert.equal(Either.isRight(result), true)
console.log("statsig-shared test passed")
