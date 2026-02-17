import { Data } from "effect"

export class StatsigModelError extends Data.TaggedError("StatsigModelError")<{
  readonly reason: string
  readonly cause?: unknown
}> {}
