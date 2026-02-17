import { Effect } from "effect"
import { NoopFeatureFlagsService } from "../../packages/core/src/index"

const run = async () => {
  const enabled = await Effect.runPromise(NoopFeatureFlagsService.check({ gate: "new-home" }))
  console.log(`core-contracts gate=new-home enabled=${enabled}`)
}

void run()
