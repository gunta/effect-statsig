import { describe, expect, it } from "vitest"
import { Either } from "effect"
import { parseStatsigConfig, parseStatsigUser, StatsigModelError } from "../src"

describe("statsig shared model", () => {
  it("parses a valid config", () => {
    const result = parseStatsigConfig({
      environment: "prod",
      serverSecretKey: "secret",
      apiUrl: "https://api.statsig.com",
      bootstrapValues: {
        checkout_gate: true,
        dynamic_limit: 4,
        nested: { region: "us-east-1" }
      }
    })

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.environment).toBe("prod")
      expect(result.right.bootstrapValues?.checkout_gate).toBe(true)
      expect(result.right.bootstrapValues?.dynamic_limit).toBe(4)
    }
  })

  it("fails invalid config", () => {
    const result = parseStatsigConfig({ serverSecretKey: "secret" })
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(StatsigModelError)
      expect(result.left._tag).toBe("StatsigModelError")
    }
  })

  it("fails config with invalid bootstrap container type", () => {
    const result = parseStatsigConfig({
      environment: "prod",
      bootstrapValues: ["not-an-object"]
    })

    expect(Either.isLeft(result)).toBe(true)
  })

  it("parses a valid user", () => {
    const result = parseStatsigUser({
      userId: "u-1",
      country: "US",
      email: "u-1@example.com",
      custom: {
        plan: "pro",
        lifetimeValue: 1200
      }
    })
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.custom?.plan).toBe("pro")
      expect(result.right.custom?.lifetimeValue).toBe(1200)
    }
  })

  it("fails invalid user", () => {
    const result = parseStatsigUser({})
    expect(Either.isLeft(result)).toBe(true)
  })

  it("fails user with invalid custom field type", () => {
    const result = parseStatsigUser({ userId: "u-1", custom: "invalid-custom" })
    expect(Either.isLeft(result)).toBe(true)
  })
})
