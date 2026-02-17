import { readdirSync } from "node:fs"

const entries = readdirSync(".changeset").filter((name) => name.endsWith(".md"))
if (entries.length === 0) {
  console.error("No changeset markdown files found in .changeset")
  process.exit(1)
}

console.log(`Release readiness check passed with ${entries.length} changeset file(s)`)
