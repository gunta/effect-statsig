import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@effect-statsig/core": resolve(__dirname, "packages/core/src/index.ts"),
      "@effect-statsig/statsig": resolve(__dirname, "packages/statsig/src/index.ts"),
      "@effect-statsig/node": resolve(__dirname, "packages/node/src/index.ts"),
      "@effect-statsig/browser": resolve(__dirname, "packages/browser/src/index.ts"),
      "@effect-statsig/react": resolve(__dirname, "packages/react/src/index.ts"),
      "@effect-statsig/cloudflare": resolve(__dirname, "packages/cloudflare/src/index.ts"),
      "@effect-statsig/expo": resolve(__dirname, "packages/expo/src/index.ts"),
      "@effect-statsig/buildtime": resolve(__dirname, "packages/buildtime/src/index.ts")
    }
  },
  test: {
    include: ["packages/*/test/**/*.test.ts", "packages/*/test/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportsDirectory: "coverage"
    }
  }
})
