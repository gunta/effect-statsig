import * as Schema from "@effect/schema/Schema"
import { Either } from "effect"
import { StatsigModelError } from "./StatsigError"

export const StatsigUserSchema = Schema.Struct({
  userId: Schema.String,
  email: Schema.optional(Schema.String),
  country: Schema.optional(Schema.String),
  custom: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
})

export type StatsigUser = {
  readonly userId: string
  readonly email?: string
  readonly country?: string
  readonly custom?: Readonly<Record<string, unknown>>
}

const decodeUser = Schema.decodeUnknownEither(StatsigUserSchema)

export const parseStatsigUser = (input: unknown): Either.Either<StatsigUser, StatsigModelError> =>
  Either.mapLeft(decodeUser(input), () => new StatsigModelError({ reason: "Invalid StatsigUser" }))
