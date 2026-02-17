// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Effect } from "effect"
import { DynamicConfigError, ExperimentError, FeatureFlagError } from "@effect-statsig/core"
import { StatsigProvider, useAnalytics, useDynamicConfig, useExperiment, useFeatureFlag } from "../src"

const makeDeferred = <A,>() => {
  let resolve!: (value: A | PromiseLike<A>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<A>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("react adapter error handling", () => {
  it("throws when hooks are used without provider", () => {
    const View = () => {
      void useFeatureFlag("missing_provider")
      return <div>invalid</div>
    }

    expect(() => render(<View />)).toThrow("StatsigProvider is required")
  })

  it("returns fallback values and error messages when async lookups fail", async () => {
    const services = {
      featureFlags: {
        check: () => Effect.fail(new FeatureFlagError({ reason: "flag lookup failed" })),
        checkWithExposure: () => Effect.fail(new FeatureFlagError({ reason: "flag lookup failed" }))
      },
      analytics: {
        logEvent: () => Effect.void,
        flush: () => Effect.void,
        shutdown: () => Effect.void
      },
      experiments: {
        get: () => Effect.fail(new ExperimentError({ reason: "experiment lookup failed" })),
        getLayer: () => Effect.fail(new ExperimentError({ reason: "layer lookup failed" }))
      },
      dynamicConfig: {
        get: () => Effect.fail(new DynamicConfigError({ reason: "config lookup failed" }))
      }
    }

    const View = () => {
      const flag = useFeatureFlag("unstable_gate")
      const experiment = useExperiment("checkout")
      const config = useDynamicConfig("homepage")
      return (
        <div>
          <span data-testid="flag-value">{flag.value ? "on" : "off"}</span>
          <span data-testid="flag-error">{flag.error ?? ""}</span>
          <span data-testid="experiment-value">{experiment.value.variant}</span>
          <span data-testid="experiment-error">{experiment.error ?? ""}</span>
          <span data-testid="config-size">{String(Object.keys(config.value.values).length)}</span>
          <span data-testid="config-error">{config.error ?? ""}</span>
        </div>
      )
    }

    render(
      <StatsigProvider
        featureFlags={services.featureFlags}
        analytics={services.analytics}
        experiments={services.experiments}
        dynamicConfig={services.dynamicConfig}
      >
        <View />
      </StatsigProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("flag-error").textContent).toContain("FeatureFlagError")
      expect(screen.getByTestId("experiment-error").textContent).toContain("ExperimentError")
      expect(screen.getByTestId("config-error").textContent).toContain("DynamicConfigError")
    })

    expect(screen.getByTestId("flag-value").textContent).toBe("off")
    expect(screen.getByTestId("experiment-value").textContent).toBe("control")
    expect(screen.getByTestId("config-size").textContent).toBe("0")
  })

  it("forwards analytics operations from useAnalytics", async () => {
    const calls: string[] = []
    const services = {
      featureFlags: {
        check: () => Effect.succeed(true),
        checkWithExposure: () => Effect.succeed(true)
      },
      analytics: {
        logEvent: () => {
          calls.push("logEvent")
          return Effect.void
        },
        flush: () => {
          calls.push("flush")
          return Effect.void
        },
        shutdown: () => {
          calls.push("shutdown")
          return Effect.void
        }
      },
      experiments: {
        get: () => Effect.succeed({ name: "checkout", variant: "a", parameters: {} }),
        getLayer: () => Effect.succeed({ name: "layer", values: {} })
      },
      dynamicConfig: {
        get: () => Effect.succeed({ name: "homepage", values: {} })
      }
    }

    const View = () => {
      const analytics = useAnalytics()
      return (
        <button
          type="button"
          data-testid="analytics-run"
          onClick={() => {
            void Effect.runPromise(
              Effect.gen(function* () {
                yield* analytics.logEvent({ name: "checkout_view", user: { userId: "u-1" } })
                yield* analytics.flush()
                yield* analytics.shutdown()
              })
            )
          }}
        >
          run
        </button>
      )
    }

    render(
      <StatsigProvider
        featureFlags={services.featureFlags}
        analytics={services.analytics}
        experiments={services.experiments}
        dynamicConfig={services.dynamicConfig}
      >
        <View />
      </StatsigProvider>
    )

    fireEvent.click(screen.getByTestId("analytics-run"))

    await waitFor(() => {
      expect(calls).toEqual(["logEvent", "flush", "shutdown"])
    })
  })

  it("cleans up async success handlers on unmount", async () => {
    const flagDeferred = makeDeferred<boolean>()
    const experimentDeferred = makeDeferred<{ name: string; variant: string; parameters: Readonly<Record<string, never>> }>()
    const configDeferred = makeDeferred<{ name: string; values: Readonly<Record<string, string>> }>()

    const services = {
      featureFlags: {
        check: () =>
          Effect.tryPromise({
            try: () => flagDeferred.promise,
            catch: (cause) => new FeatureFlagError({ reason: "flag deferred failed", cause })
          }),
        checkWithExposure: () => Effect.succeed(true)
      },
      analytics: {
        logEvent: () => Effect.void,
        flush: () => Effect.void,
        shutdown: () => Effect.void
      },
      experiments: {
        get: () =>
          Effect.tryPromise({
            try: () => experimentDeferred.promise,
            catch: (cause) => new ExperimentError({ reason: "experiment deferred failed", cause })
          }),
        getLayer: () => Effect.succeed({ name: "layer", values: {} })
      },
      dynamicConfig: {
        get: () =>
          Effect.tryPromise({
            try: () => configDeferred.promise,
            catch: (cause) => new DynamicConfigError({ reason: "config deferred failed", cause })
          })
      }
    }

    const View = () => {
      void useFeatureFlag("gate")
      void useExperiment("checkout")
      void useDynamicConfig("homepage")
      return <div data-testid="ready">ready</div>
    }

    const renderResult = render(
      <StatsigProvider
        featureFlags={services.featureFlags}
        analytics={services.analytics}
        experiments={services.experiments}
        dynamicConfig={services.dynamicConfig}
      >
        <View />
      </StatsigProvider>
    )

    expect(screen.getByTestId("ready").textContent).toBe("ready")
    renderResult.unmount()

    flagDeferred.resolve(true)
    experimentDeferred.resolve({ name: "checkout", variant: "success", parameters: {} })
    configDeferred.resolve({ name: "homepage", values: { color: "blue" } })

    await Promise.resolve()
    await Promise.resolve()
  })

  it("cleans up async failure handlers on unmount", async () => {
    const flagDeferred = makeDeferred<boolean>()
    const experimentDeferred = makeDeferred<{ name: string; variant: string; parameters: Readonly<Record<string, never>> }>()
    const configDeferred = makeDeferred<{ name: string; values: Readonly<Record<string, string>> }>()

    const services = {
      featureFlags: {
        check: () =>
          Effect.tryPromise({
            try: () => flagDeferred.promise,
            catch: (cause) => new FeatureFlagError({ reason: "flag deferred failed", cause })
          }),
        checkWithExposure: () => Effect.succeed(true)
      },
      analytics: {
        logEvent: () => Effect.void,
        flush: () => Effect.void,
        shutdown: () => Effect.void
      },
      experiments: {
        get: () =>
          Effect.tryPromise({
            try: () => experimentDeferred.promise,
            catch: (cause) => new ExperimentError({ reason: "experiment deferred failed", cause })
          }),
        getLayer: () => Effect.succeed({ name: "layer", values: {} })
      },
      dynamicConfig: {
        get: () =>
          Effect.tryPromise({
            try: () => configDeferred.promise,
            catch: (cause) => new DynamicConfigError({ reason: "config deferred failed", cause })
          })
      }
    }

    const View = () => {
      void useFeatureFlag("gate")
      void useExperiment("checkout")
      void useDynamicConfig("homepage")
      return <div data-testid="ready">ready</div>
    }

    const renderResult = render(
      <StatsigProvider
        featureFlags={services.featureFlags}
        analytics={services.analytics}
        experiments={services.experiments}
        dynamicConfig={services.dynamicConfig}
      >
        <View />
      </StatsigProvider>
    )

    expect(screen.getByTestId("ready").textContent).toBe("ready")
    renderResult.unmount()

    flagDeferred.reject(new FeatureFlagError({ reason: "flag async failure" }))
    experimentDeferred.reject(new ExperimentError({ reason: "experiment async failure" }))
    configDeferred.reject(new DynamicConfigError({ reason: "config async failure" }))

    await Promise.resolve()
    await Promise.resolve()
  })
})
