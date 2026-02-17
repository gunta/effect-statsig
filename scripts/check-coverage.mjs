import { existsSync, readFileSync } from "node:fs"

const summaryPath = "coverage/coverage-summary.json"
if (!existsSync(summaryPath)) {
  console.error("Coverage summary not found. Run tests with coverage first.")
  process.exit(1)
}

const summary = JSON.parse(readFileSync(summaryPath, "utf8"))
const totals = summary.total

function aggregateLines(filter) {
  let total = 0
  let covered = 0
  for (const [file, metrics] of Object.entries(summary)) {
    if (file === "total") {
      continue
    }
    if (!filter(file)) {
      continue
    }
    total += metrics.lines.total
    covered += metrics.lines.covered
  }
  if (total === 0) {
    return 0
  }
  return (covered / total) * 100
}

const corePct = aggregateLines((file) => file.includes("/packages/core/src/"))
const adaptersPct = aggregateLines(
  (file) =>
    file.includes("/packages/node/src/") ||
    file.includes("/packages/browser/src/") ||
    file.includes("/packages/react/src/") ||
    file.includes("/packages/cloudflare/src/") ||
    file.includes("/packages/expo/src/") ||
    file.includes("/packages/buildtime/src/")
)

const failures = []
if (totals.lines.pct < 100) {
  failures.push(`Total line coverage ${totals.lines.pct.toFixed(2)}% is below 100%`)
}
if (totals.statements.pct < 100) {
  failures.push(`Total statement coverage ${totals.statements.pct.toFixed(2)}% is below 100%`)
}
if (totals.functions.pct < 100) {
  failures.push(`Total function coverage ${totals.functions.pct.toFixed(2)}% is below 100%`)
}
if (totals.branches.pct < 100) {
  failures.push(`Total branch coverage ${totals.branches.pct.toFixed(2)}% is below 100%`)
}
if (corePct < 90) {
  failures.push(`Core line coverage ${corePct.toFixed(2)}% is below 90%`)
}
if (adaptersPct < 80) {
  failures.push(`Adapter line coverage ${adaptersPct.toFixed(2)}% is below 80%`)
}

if (failures.length > 0) {
  console.error("Coverage policy check failed:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(
  `Coverage checks passed (total lines=${totals.lines.pct.toFixed(2)}%, total branches=${totals.branches.pct.toFixed(2)}%, core=${corePct.toFixed(2)}%, adapters=${adaptersPct.toFixed(2)}%)`
)
