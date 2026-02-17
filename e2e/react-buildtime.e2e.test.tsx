// @vitest-environment jsdom
import React from "react"
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Effect } from "effect"
import { FeatureFlagError, FeatureFlagsService } from "@effect-statsig/core"
import { composeFeatureFlags } from "@effect-statsig/buildtime"
import { StatsigProvider, useAnalytics, useDynamicConfig, useExperiment, useFeatureFlag } from "@effect-statsig/react"

describe("react buildtime e2e", () => {
  it("hydrates from server values and converges to remote plus buildtime-composed behavior", async () => {
    const analyticsCalls: string[] = []

    const remoteFlags: FeatureFlagsService = {
      check: (input) => {
        if (input.gate === "buildtime_kill_switch") {
          return Effect.fail(new FeatureFlagError({ reason: "remote unavailable" }))
        }
        return Effect.succeed(input.gate === "remote_checkout")
      },
      checkWithExposure: (input) => {
        if (input.gate === "buildtime_kill_switch") {
          return Effect.fail(new FeatureFlagError({ reason: "remote unavailable" }))
        }
        return Effect.succeed(input.gate === "remote_checkout")
      }
    }

    const featureFlags = composeFeatureFlags({ buildtime_kill_switch: true }, remoteFlags, "remote-first")

    const services = {
      featureFlags,
      analytics: {
        logEvent: () => {
          analyticsCalls.push("logEvent")
          return Effect.void
        },
        flush: () => {
          analyticsCalls.push("flush")
          return Effect.void
        },
        shutdown: () => {
          analyticsCalls.push("shutdown")
          return Effect.void
        }
      },
      experiments: {
        get: () => Effect.succeed({ name: "checkout", variant: "remote-variant", parameters: { cohort: "B" } }),
        getLayer: () => Effect.succeed({ name: "copy", values: {} })
      },
      dynamicConfig: {
        get: () => Effect.succeed({ name: "homepage", values: { color: "blue" } })
      }
    }

    const View = () => {
      const killSwitch = useFeatureFlag("buildtime_kill_switch")
      const checkout = useFeatureFlag("remote_checkout")
      const experiment = useExperiment("checkout")
      const config = useDynamicConfig("homepage")
      const analytics = useAnalytics()

      return (
        <div>
          <span data-testid="kill-switch">{killSwitch.value ? "on" : "off"}</span>
          <span data-testid="checkout">{checkout.value ? "on" : "off"}</span>
          <span data-testid="variant">{experiment.value.variant}</span>
          <span data-testid="color">{String(config.value.values.color ?? "none")}</span>
          <button
            type="button"
            data-testid="track"
            onClick={() => {
              void Effect.runPromise(
                Effect.gen(function* () {
                  yield* analytics.logEvent({ name: "checkout_viewed", user: { userId: "u-1" } })
                  yield* analytics.flush()
                  yield* analytics.shutdown()
                })
              )
            }}
          >
            track
          </button>
        </div>
      )
    }

    render(
      <StatsigProvider
        featureFlags={services.featureFlags}
        analytics={services.analytics}
        experiments={services.experiments}
        dynamicConfig={services.dynamicConfig}
        hydration={{
          flags: {
            buildtime_kill_switch: false,
            remote_checkout: false
          },
          experiments: {
            checkout: {
              variant: "ssr-control",
              parameters: {}
            }
          },
          dynamicConfigs: {
            homepage: {
              color: "green"
            }
          }
        }}
      >
        <View />
      </StatsigProvider>
    )

    expect(screen.getByTestId("kill-switch").textContent).toBe("off")
    expect(screen.getByTestId("checkout").textContent).toBe("off")
    expect(screen.getByTestId("variant").textContent).toBe("ssr-control")
    expect(screen.getByTestId("color").textContent).toBe("green")

    await waitFor(() => {
      expect(screen.getByTestId("kill-switch").textContent).toBe("on")
      expect(screen.getByTestId("checkout").textContent).toBe("on")
      expect(screen.getByTestId("variant").textContent).toBe("remote-variant")
      expect(screen.getByTestId("color").textContent).toBe("blue")
    })

    fireEvent.click(screen.getByTestId("track"))

    await waitFor(() => {
      expect(analyticsCalls).toEqual(["logEvent", "flush", "shutdown"])
    })
  })
})
