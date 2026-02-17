import { Data, Effect } from "effect"
import { FeatureFlagError, FeatureFlagsService } from "@effect-statsig/core"

export class BuildtimeError extends Data.TaggedError("BuildtimeError")<{
  readonly reason: string
  readonly cause?: unknown
}> {}

export type BuildtimeFlagsMap = Readonly<Record<string, boolean>>

export type ComposePrecedence = "buildtime-first" | "remote-first"

export const makeBuildtimeFeatureFlags = (flags: BuildtimeFlagsMap): FeatureFlagsService => ({
  check: (input) => Effect.succeed(flags[input.gate] ?? false),
  checkWithExposure: (input) => Effect.succeed(flags[input.gate] ?? false)
})

export const composeFeatureFlags = (
  flags: BuildtimeFlagsMap,
  remote: FeatureFlagsService,
  precedence: ComposePrecedence
): FeatureFlagsService => ({
  check: (input) => {
    switch (precedence) {
      case "buildtime-first":
        if (input.gate in flags) {
          return Effect.succeed(flags[input.gate])
        }
        return remote.check(input)
      case "remote-first":
        return remote.check(input).pipe(
          Effect.catchAll((error) =>
            input.gate in flags
              ? Effect.succeed(flags[input.gate])
              : Effect.fail(new FeatureFlagError({ reason: error.reason, cause: error.cause }))
          )
        )
    }
  },
  checkWithExposure: (input) => {
    switch (precedence) {
      case "buildtime-first":
        if (input.gate in flags) {
          return Effect.succeed(flags[input.gate])
        }
        return remote.checkWithExposure(input)
      case "remote-first":
        return remote.checkWithExposure(input).pipe(
          Effect.catchAll((error) =>
            input.gate in flags
              ? Effect.succeed(flags[input.gate])
              : Effect.fail(new FeatureFlagError({ reason: error.reason, cause: error.cause }))
          )
        )
    }
  }
})
