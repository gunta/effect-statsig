import * as Schema from "@effect/schema/Schema"
import { Either } from "effect"
import { StatsigModelError } from "./StatsigError"

export const StatsigConfigSchema = Schema.Struct({
  environment: Schema.String,
  serverSecretKey: Schema.optional(Schema.String),
  clientKey: Schema.optional(Schema.String),
  apiUrl: Schema.optional(Schema.String),
  bootstrapValues: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
})

export type StatsigConfig = {
  readonly environment: string
  readonly serverSecretKey?: string
  readonly clientKey?: string
  readonly apiUrl?: string
  readonly bootstrapValues?: Readonly<Record<string, unknown>>
}

const decodeConfig = Schema.decodeUnknownEither(StatsigConfigSchema)

export const parseStatsigConfig = (input: unknown): Either.Either<StatsigConfig, StatsigModelError> =>
  Either.mapLeft(decodeConfig(input), () => new StatsigModelError({ reason: "Invalid StatsigConfig" }))
