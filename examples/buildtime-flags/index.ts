import { Effect } from "effect"
import { FeatureFlagsService } from "../../packages/core/src/index"
import { composeFeatureFlags, makeBuildtimeFeatureFlags } from "../../packages/buildtime/src/index"

const buildtime = { experiment_guardrail: true }
const buildtimeProvider = makeBuildtimeFeatureFlags(buildtime)

const remote: FeatureFlagsService = {
  check: () => Effect.succeed(false),
  checkWithExposure: () => Effect.succeed(false)
}

const composed = composeFeatureFlags(buildtime, remote, "buildtime-first")
const enabled = await Effect.runPromise(composed.check({ gate: "experiment_guardrail" }))
const local = await Effect.runPromise(buildtimeProvider.check({ gate: "experiment_guardrail" }))
console.log(`buildtime-flags composed=${enabled} local=${local}`)
