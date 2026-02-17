import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import {
  Analytics,
  DynamicConfig,
  FeatureFlagError,
  FeatureFlags,
  NoopAnalyticsService,
  NoopDynamicConfigService,
  NoopExperimentsService,
  NoopFeatureFlagsService,
  NoopAnalyticsLayer,
  NoopDynamicConfigLayer,
  NoopExperimentsLayer,
  NoopFeatureFlagsLayer
} from "../src"

describe("core contracts", () => {
  it("provides FeatureFlags service through Effect context", async () => {
    const program = Effect.gen(function* () {
      const flags = yield* FeatureFlags
      return yield* flags.check({ gate: "new-home" })
    }).pipe(
      Effect.provideService(FeatureFlags, {
        check: (input) => Effect.succeed(input.gate === "new-home"),
        checkWithExposure: (input) => Effect.succeed(input.gate === "new-home")
      })
    )

    const result = await Effect.runPromise(program)
    expect(result).toBe(true)
  })

  it("returns no-op defaults from no-op layers", async () => {
    const program = Effect.gen(function* () {
      const flags = yield* FeatureFlags
      const analytics = yield* Analytics
      const dynamicConfig = yield* DynamicConfig
      const enabled = yield* flags.check({ gate: "missing" })
      yield* analytics.logEvent({ name: "sample", user: { userId: "u-1" } })
      const cfg = yield* dynamicConfig.get({ config: "homepage" })
      return { enabled, cfg }
    }).pipe(
      Effect.provide(NoopFeatureFlagsLayer),
      Effect.provide(NoopAnalyticsLayer),
      Effect.provide(NoopExperimentsLayer),
      Effect.provide(NoopDynamicConfigLayer)
    )

    const result = await Effect.runPromise(program)
    expect(result.enabled).toBe(false)
    expect(result.cfg.name).toBe("homepage")
  })

  it("keeps tagged error identity", () => {
    const err = new FeatureFlagError({ reason: "boom" })
    expect(err._tag).toBe("FeatureFlagError")
  })

  it("executes all no-op service methods", async () => {
    const gate = await Effect.runPromise(NoopFeatureFlagsService.checkWithExposure({ gate: "g" }))
    const exp = await Effect.runPromise(NoopExperimentsService.get({ experiment: "exp" }))
    const layer = await Effect.runPromise(NoopExperimentsService.getLayer({ layer: "layer" }))
    const cfg = await Effect.runPromise(NoopDynamicConfigService.get({ config: "cfg" }))
    await Effect.runPromise(NoopAnalyticsService.logEvent({ name: "event", user: { userId: "u-1" } }))
    await Effect.runPromise(NoopAnalyticsService.flush())
    await Effect.runPromise(NoopAnalyticsService.shutdown())

    expect(gate).toBe(false)
    expect(exp.variant).toBe("control")
    expect(layer.name).toBe("layer")
    expect(cfg.name).toBe("cfg")
  })
})
