import { Effect } from "effect"
import { BuildtimeError, BuildtimeFlagsMap } from "./BuildtimeFlags"

export const flagsFromInline = (flags: BuildtimeFlagsMap): BuildtimeFlagsMap => flags

const parseBoolean = (raw: string, key: string): Effect.Effect<boolean, BuildtimeError> => {
  if (raw === "true") {
    return Effect.succeed(true)
  }
  if (raw === "false") {
    return Effect.succeed(false)
  }
  return Effect.fail(new BuildtimeError({ reason: `Invalid boolean for ${key}` }))
}

export const flagsFromEnv = (
  env: Readonly<Record<string, string | undefined>>,
  prefix = "FF_"
): Effect.Effect<BuildtimeFlagsMap, BuildtimeError> =>
  Effect.gen(function* () {
    const entries = Object.entries(env).filter(([key, value]) => key.startsWith(prefix) && value !== undefined)
    const output: Record<string, boolean> = {}

    for (const [key, value] of entries) {
      const gate = key.slice(prefix.length).toLowerCase()
      const parsed = yield* parseBoolean(value as string, key)
      output[gate] = parsed
    }

    return output
  })

export const flagsFromJson = (json: string): Effect.Effect<BuildtimeFlagsMap, BuildtimeError> =>
  Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(json) as unknown,
      catch: (cause) => new BuildtimeError({ reason: "Invalid JSON", cause })
    })

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return yield* Effect.fail(new BuildtimeError({ reason: "JSON must be an object" }))
    }

    const output: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "boolean") {
        return yield* Effect.fail(new BuildtimeError({ reason: `Invalid value for ${key}` }))
      }
      output[key] = value
    }

    return output
  })
