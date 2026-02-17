import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, extname } from "node:path"

const roots = ["packages", "examples", "scripts", "e2e"]
const exts = new Set([".ts", ".tsx", ".js", ".mjs"])

const errors = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === "coverage") {
      continue
    }
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walk(path)
      continue
    }
    if (!exts.has(extname(path))) {
      continue
    }
    const content = readFileSync(path, "utf8")
    const lines = content.split("\n")
    lines.forEach((line, index) => {
      if (line.endsWith(" ")) {
        errors.push(`${path}:${index + 1} trailing whitespace`)
      }
      if (path !== "scripts/lint.mjs" && /(:\s*any\b|<any>|\bArray<any>)/.test(line)) {
        errors.push(`${path}:${index + 1} avoid any type`)
      }
    })
  }
}

for (const root of roots) {
  try {
    walk(root)
  } catch {
    // optional root
  }
}

if (errors.length > 0) {
  console.error("Lint violations detected:")
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log("Lint checks passed")
