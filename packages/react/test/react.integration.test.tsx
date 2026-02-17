// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Effect } from "effect"
import { StatsigProvider, useFeatureFlag } from "../src"

describe("react adapter integration", () => {
  it("supports SSR bootstrap style hydration values", () => {
    const services = {
      featureFlags: {
        check: () => Effect.succeed(true),
        checkWithExposure: () => Effect.succeed(true)
      },
      analytics: {
        logEvent: () => Effect.void,
        flush: () => Effect.void,
        shutdown: () => Effect.void
      },
      experiments: {
        get: () => Effect.succeed({ name: "checkout", variant: "v1", parameters: {} }),
        getLayer: () => Effect.succeed({ name: "layer", values: {} })
      },
      dynamicConfig: {
        get: () => Effect.succeed({ name: "cfg", values: {} })
      }
    }

    const View = () => {
      const flag = useFeatureFlag("from_ssr")
      return <span data-testid="flag">{flag.value ? "on" : "off"}</span>
    }

    render(
      <StatsigProvider
        featureFlags={services.featureFlags}
        analytics={services.analytics}
        experiments={services.experiments}
        dynamicConfig={services.dynamicConfig}
        hydration={{ flags: { from_ssr: true } }}
      >
        <View />
      </StatsigProvider>
    )

    expect(screen.getByTestId("flag").textContent).toBe("on")
  })
})
