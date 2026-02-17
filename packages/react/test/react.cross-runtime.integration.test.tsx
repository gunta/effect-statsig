// @vitest-environment jsdom
import React from "react"
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Either, Effect } from "effect"
import { BrowserStatsigClient, makeBrowserServices } from "@effect-statsig/browser"
import { makeNodeServices, NodeStatsigClient } from "@effect-statsig/node"
import { StatsigProvider, useAnalytics, useDynamicConfig, useExperiment, useFeatureFlag } from "../src"

describe("react cross runtime integration", () => {
  it("keeps evaluation behavior stable when mixed analytics provider fails", async () => {
    const browserCalls: string[] = []
    const nodeCalls: string[] = []

    const browserClient: BrowserStatsigClient = {
      initialize: async () => undefined,
      updateUser: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async (gate) => {
        browserCalls.push(`check:${gate}`)
        return gate === "browser_gate"
      },
      getExperiment: async () => ({ name: "checkout", variant: "browser-variant", parameters: {} }),
      getLayer: async () => ({ name: "copy", values: {} }),
      getDynamicConfig: async () => ({ name: "homepage", values: { color: "orange" } }),
      logEvent: async () => undefined,
      flush: async () => undefined
    }

    const nodeClient: NodeStatsigClient = {
      initialize: async () => undefined,
      shutdown: async () => undefined,
      checkGate: async () => true,
      getExperiment: async () => ({ name: "unused", variant: "unused", parameters: {} }),
      getLayer: async () => ({ name: "unused", values: {} }),
      getDynamicConfig: async () => ({ name: "unused", values: {} }),
      logEvent: async () => {
        nodeCalls.push("logEvent")
        throw new Error("analytics backend unavailable")
      },
      flush: async () => {
        nodeCalls.push("flush")
      }
    }

    const browserServices = makeBrowserServices(browserClient)
    const nodeServices = makeNodeServices(nodeClient, { userId: "u-1" })

    const View = () => {
      const flag = useFeatureFlag("browser_gate")
      const experiment = useExperiment("checkout")
      const config = useDynamicConfig("homepage")
      const analytics = useAnalytics()
      const [analyticsStatus, setAnalyticsStatus] = React.useState("idle")

      return (
        <div>
          <span data-testid="flag">{flag.value ? "on" : "off"}</span>
          <span data-testid="experiment">{experiment.value.variant}</span>
          <span data-testid="config">{String(config.value.values.color ?? "none")}</span>
          <span data-testid="analytics-status">{analyticsStatus}</span>
          <button
            type="button"
            data-testid="track"
            onClick={() => {
              void Effect.runPromise(
                Effect.either(analytics.logEvent({ name: "checkout_viewed", user: { userId: "u-1" } }))
              ).then((result) => {
                if (Either.isLeft(result)) {
                  setAnalyticsStatus(result.left.reason)
                } else {
                  setAnalyticsStatus("ok")
                }
              })
            }}
          >
            track
          </button>
        </div>
      )
    }

    render(
      <StatsigProvider
        featureFlags={browserServices.featureFlags}
        experiments={browserServices.experiments}
        dynamicConfig={browserServices.dynamicConfig}
        analytics={nodeServices.analytics}
        hydration={{
          flags: { browser_gate: false },
          experiments: { checkout: { variant: "hydrated-control", parameters: {} } },
          dynamicConfigs: { homepage: { color: "green" } }
        }}
      >
        <View />
      </StatsigProvider>
    )

    expect(screen.getByTestId("flag").textContent).toBe("off")
    expect(screen.getByTestId("experiment").textContent).toBe("hydrated-control")
    expect(screen.getByTestId("config").textContent).toBe("green")
    expect(screen.getByTestId("analytics-status").textContent).toBe("idle")

    await waitFor(() => {
      expect(screen.getByTestId("flag").textContent).toBe("on")
      expect(screen.getByTestId("experiment").textContent).toBe("browser-variant")
      expect(screen.getByTestId("config").textContent).toBe("orange")
    })

    fireEvent.click(screen.getByTestId("track"))

    await waitFor(() => {
      expect(screen.getByTestId("analytics-status").textContent).toBe("logEvent")
    })

    expect(browserCalls).toContain("check:browser_gate")
    expect(nodeCalls).toContain("logEvent")
    expect(screen.getByTestId("flag").textContent).toBe("on")
    expect(screen.getByTestId("experiment").textContent).toBe("browser-variant")
    expect(screen.getByTestId("config").textContent).toBe("orange")
  })
})
