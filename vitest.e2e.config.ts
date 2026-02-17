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
    include: ["e2e/**/*.e2e.test.ts", "e2e/**/*.e2e.test.tsx"]
  }
})
