// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { Effect } from "effect"
import { BrowserStatsigClient, makeBrowserServices } from "@effect-statsig/browser"
import { composeFeatureFlags } from "@effect-statsig/buildtime"
import { StatsigProvider, useDynamicConfig, useExperiment, useFeatureFlag } from "../src"

describe("react mixed integration", () => {
  it("renders correctly with browser services and buildtime-composed feature flags", async () => {
    const calls: string[] = []

    const browserClient: BrowserStatsigClient = {
      initialize: async () => undefined,
      updateUser: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async (gate) => {
        calls.push(`check:${gate}`)
        if (gate === "buildtime_kill_switch") {
          throw new Error("remote unavailable")
        }
        return gate === "remote_checkout"
      },
      getExperiment: async () => ({ name: "checkout", variant: "browser-variant", parameters: { cohort: "b" } }),
      getLayer: async () => ({ name: "copy", values: {} }),
      getDynamicConfig: async () => ({ name: "homepage", values: { color: "teal" } }),
      logEvent: async () => undefined,
      flush: async () => undefined
    }

    const browserServices = makeBrowserServices(browserClient)
    const featureFlags = composeFeatureFlags({ buildtime_kill_switch: true }, browserServices.featureFlags, "remote-first")

    const View = () => {
      const killSwitch = useFeatureFlag("buildtime_kill_switch")
      const checkout = useFeatureFlag("remote_checkout")
      const experiment = useExperiment("checkout")
      const config = useDynamicConfig("homepage")

      return (
        <div>
          <span data-testid="kill-switch">{killSwitch.value ? "on" : "off"}</span>
          <span data-testid="checkout">{checkout.value ? "on" : "off"}</span>
          <span data-testid="variant">{experiment.value.variant}</span>
          <span data-testid="color">{String(config.value.values.color ?? "none")}</span>
        </div>
      )
    }

    render(
      <StatsigProvider
        featureFlags={featureFlags}
        analytics={browserServices.analytics}
        experiments={browserServices.experiments}
        dynamicConfig={browserServices.dynamicConfig}
        hydration={{
          flags: {
            buildtime_kill_switch: false,
            remote_checkout: false
          },
          experiments: {
            checkout: {
              variant: "hydrated-control",
              parameters: {}
            }
          },
          dynamicConfigs: {
            homepage: {
              color: "blue"
            }
          }
        }}
      >
        <View />
      </StatsigProvider>
    )

    expect(screen.getByTestId("kill-switch").textContent).toBe("off")
    expect(screen.getByTestId("checkout").textContent).toBe("off")
    expect(screen.getByTestId("variant").textContent).toBe("hydrated-control")
    expect(screen.getByTestId("color").textContent).toBe("blue")

    await waitFor(() => {
      expect(screen.getByTestId("kill-switch").textContent).toBe("on")
      expect(screen.getByTestId("checkout").textContent).toBe("on")
      expect(screen.getByTestId("variant").textContent).toBe("browser-variant")
      expect(screen.getByTestId("color").textContent).toBe("teal")
    })

    expect(calls).toContain("check:buildtime_kill_switch")
    expect(calls).toContain("check:remote_checkout")
  })
})
