// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { Effect } from "effect"
import { StatsigProvider, useFeatureFlag, useExperiment, useDynamicConfig, useAnalytics } from "../src"

const makeServices = () => ({
  featureFlags: {
    check: (input: { readonly gate: string }) => Effect.succeed(input.gate === "enabled"),
    checkWithExposure: (input: { readonly gate: string }) => Effect.succeed(input.gate === "enabled")
  },
  analytics: {
    logEvent: () => Effect.void,
    flush: () => Effect.void,
    shutdown: () => Effect.void
  },
  experiments: {
    get: (input: { readonly experiment: string }) =>
      Effect.succeed({ name: input.experiment, variant: "variant-a", parameters: {} }),
    getLayer: (input: { readonly layer: string }) => Effect.succeed({ name: input.layer, values: {} })
  },
  dynamicConfig: {
    get: (input: { readonly config: string }) => Effect.succeed({ name: input.config, values: { color: "blue" } })
  }
})

describe("react adapter", () => {
  it("exposes hooks with hydrated values and async updates", async () => {
    const services = makeServices()

    const View = () => {
      const flag = useFeatureFlag("enabled")
      const experiment = useExperiment("checkout")
      const config = useDynamicConfig("homepage")
      const analytics = useAnalytics()
      void analytics

      return (
        <div>
          <span data-testid="flag">{flag.value ? "on" : "off"}</span>
          <span data-testid="experiment">{experiment.value.variant}</span>
          <span data-testid="config">{String(config.value.values.color ?? "none")}</span>
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
          flags: { enabled: true },
          experiments: { checkout: { variant: "hydrated", parameters: {} } },
          dynamicConfigs: { homepage: { color: "green" } }
        }}
      >
        <View />
      </StatsigProvider>
    )

    expect(screen.getByTestId("flag").textContent).toBe("on")
    expect(screen.getByTestId("experiment").textContent).toBe("hydrated")
    expect(screen.getByTestId("config").textContent).toBe("green")

    await waitFor(() => {
      expect(screen.getByTestId("experiment").textContent).toBe("variant-a")
      expect(screen.getByTestId("config").textContent).toBe("blue")
    })
  })
})
