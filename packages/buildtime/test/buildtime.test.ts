import { describe, expect, it } from "vitest"
import { Effect, Either } from "effect"
import { FeatureFlagError, FeatureFlagsService } from "@effect-statsig/core"
import {
  BuildtimeError,
  composeFeatureFlags,
  flagsFromEnv,
  flagsFromInline,
  flagsFromJson,
  makeBuildtimeFeatureFlags
} from "../src"

describe("buildtime flags", () => {
  it("passes through inline flags", () => {
    const flags = { stable_checkout: true, beta_banner: false } as const
    const result = flagsFromInline(flags)
    expect(result).toEqual(flags)
  })

  it("loads flags from env", async () => {
    const flags = await Effect.runPromise(
      flagsFromEnv({ FF_NEW_DASHBOARD: "true", FF_DARK_MODE: "false", IGNORE: "false" })
    )
    expect(flags.new_dashboard).toBe(true)
    expect(flags.dark_mode).toBe(false)
  })

  it("loads flags from env with a custom prefix", async () => {
    const flags = await Effect.runPromise(flagsFromEnv({ STATSIG_PROMO: "true", STATSIG_CHECKOUT: "false" }, "STATSIG_"))
    expect(flags.promo).toBe(true)
    expect(flags.checkout).toBe(false)
  })

  it("skips undefined env values", async () => {
    const flags = await Effect.runPromise(flagsFromEnv({ FF_ONBOARDING: undefined, FF_CHECKOUT: "true" }))
    expect(flags.onboarding).toBe(undefined)
    expect(flags.checkout).toBe(true)
  })

  it("loads flags from json", async () => {
    const flags = await Effect.runPromise(flagsFromJson('{"new_ui":true}'))
    expect(flags.new_ui).toBe(true)
  })

  it("fails invalid env values", async () => {
    const failure = await Effect.runPromiseExit(flagsFromEnv({ FF_BAD: "not_bool" }))
    expect(failure._tag).toBe("Failure")
  })

  it("fails invalid json values", async () => {
    const failure = await Effect.runPromiseExit(flagsFromJson('{"bad":"value"}'))
    expect(failure._tag).toBe("Failure")
  })

  it("fails json when root is an array", async () => {
    const result = await Effect.runPromise(Effect.either(flagsFromJson("[true,false]")))
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(BuildtimeError)
      expect(result.left.reason).toBe("JSON must be an object")
    }
  })

  it("surfaces parser failures as BuildtimeError", async () => {
    const result = await Effect.runPromise(Effect.either(flagsFromJson("not-json")))
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(BuildtimeError)
      expect(result.left.reason).toBe("Invalid JSON")
    }
  })

  it("uses buildtime precedence when configured", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.succeed(false),
      checkWithExposure: () => Effect.succeed(false)
    }

    const composed = composeFeatureFlags({ enabled: true }, remote, "buildtime-first")
    const result = await Effect.runPromise(composed.check({ gate: "enabled" }))
    expect(result).toBe(true)
  })

  it("uses remote result first in remote-first mode", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.succeed(false),
      checkWithExposure: () => Effect.succeed(false)
    }

    const composed = composeFeatureFlags({ gate_x: true }, remote, "remote-first")
    const result = await Effect.runPromise(composed.check({ gate: "gate_x" }))
    expect(result).toBe(false)
  })

  it("falls back to buildtime on remote failure in remote-first mode", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.fail(new FeatureFlagError({ reason: "remote down" })),
      checkWithExposure: () => Effect.fail(new FeatureFlagError({ reason: "remote down" }))
    }

    const composed = composeFeatureFlags({ guardrail: true }, remote, "remote-first")
    const result = await Effect.runPromise(composed.check({ gate: "guardrail" }))
    expect(result).toBe(true)
  })

  it("keeps remote failure when no buildtime value exists", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.fail(new FeatureFlagError({ reason: "remote down" })),
      checkWithExposure: () => Effect.fail(new FeatureFlagError({ reason: "remote down" }))
    }

    const composed = composeFeatureFlags({}, remote, "remote-first")
    const failure = await Effect.runPromiseExit(composed.check({ gate: "missing" }))
    expect(failure._tag).toBe("Failure")
  })

  it("supports standalone buildtime provider", async () => {
    const provider = makeBuildtimeFeatureFlags({ stable: true })
    const result = await Effect.runPromise(provider.checkWithExposure({ gate: "stable" }))
    expect(result).toBe(true)
  })

  it("returns false for unknown standalone buildtime gates", async () => {
    const provider = makeBuildtimeFeatureFlags({ stable: true })
    const result = await Effect.runPromise(provider.check({ gate: "missing" }))
    expect(result).toBe(false)
  })

  it("returns false for unknown standalone exposure checks", async () => {
    const provider = makeBuildtimeFeatureFlags({ stable: true })
    const result = await Effect.runPromise(provider.checkWithExposure({ gate: "missing" }))
    expect(result).toBe(false)
  })

  it("uses buildtime value for checkWithExposure in buildtime-first mode", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.succeed(false),
      checkWithExposure: () => Effect.succeed(false)
    }
    const composed = composeFeatureFlags({ stable: true }, remote, "buildtime-first")
    const value = await Effect.runPromise(composed.checkWithExposure({ gate: "stable" }))
    expect(value).toBe(true)
  })

  it("uses remote checks when buildtime-first has no local gate", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.succeed(true),
      checkWithExposure: () => Effect.succeed(true)
    }
    const composed = composeFeatureFlags({}, remote, "buildtime-first")
    const check = await Effect.runPromise(composed.check({ gate: "missing" }))
    const exposure = await Effect.runPromise(composed.checkWithExposure({ gate: "missing" }))
    expect(check).toBe(true)
    expect(exposure).toBe(true)
  })

  it("falls back on checkWithExposure in remote-first mode", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.succeed(false),
      checkWithExposure: () => Effect.fail(new FeatureFlagError({ reason: "remote down" }))
    }
    const composed = composeFeatureFlags({ guardrail_exposure: true }, remote, "remote-first")
    const value = await Effect.runPromise(composed.checkWithExposure({ gate: "guardrail_exposure" }))
    expect(value).toBe(true)
  })

  it("uses remote checkWithExposure in remote-first mode when remote succeeds", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.succeed(false),
      checkWithExposure: () => Effect.succeed(true)
    }
    const composed = composeFeatureFlags({ guardrail_exposure: false }, remote, "remote-first")
    const value = await Effect.runPromise(composed.checkWithExposure({ gate: "guardrail_exposure" }))
    expect(value).toBe(true)
  })

  it("keeps remote checkWithExposure failure when no buildtime value exists", async () => {
    const remote: FeatureFlagsService = {
      check: () => Effect.succeed(false),
      checkWithExposure: () => Effect.fail(new FeatureFlagError({ reason: "remote down" }))
    }

    const composed = composeFeatureFlags({}, remote, "remote-first")
    const failure = await Effect.runPromiseExit(composed.checkWithExposure({ gate: "missing" }))
    expect(failure._tag).toBe("Failure")
  })
})
