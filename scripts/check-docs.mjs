import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const packageRoot = "packages"
const docsRoot = join("docs", "packages")
const examplesRoot = "examples"

const packageNames = readdirSync(packageRoot).filter((name) => {
  const dir = join(packageRoot, name)
  return statSync(dir).isDirectory() && existsSync(join(dir, "package.json"))
})
const requiredSamples = {
  core: ["core-contracts"],
  statsig: ["statsig-shared"],
  node: ["node-server"],
  browser: ["react-spa"],
  react: ["react-spa", "nextjs-app"],
  cloudflare: ["cloudflare-worker"],
  expo: ["expo-app"],
  buildtime: ["buildtime-flags"]
}

const issues = []

for (const name of packageNames) {
  const readme = join(packageRoot, name, "README.md")
  const doc = join(docsRoot, `${name}.md`)
  if (!existsSync(readme)) {
    issues.push(`Missing ${readme}`)
  }
  if (!existsSync(doc)) {
    issues.push(`Missing ${doc}`)
  }
  for (const sample of requiredSamples[name] ?? []) {
    const sampleDir = join(examplesRoot, sample)
    const sampleReadme = join(sampleDir, "README.md")
    const samplePkg = join(sampleDir, "package.json")
    if (!existsSync(sampleReadme)) {
      issues.push(`Missing ${sampleReadme}`)
    }
    if (!existsSync(samplePkg)) {
      issues.push(`Missing ${samplePkg}`)
      continue
    }
    const pkg = JSON.parse(readFileSync(samplePkg, "utf8"))
    if (!pkg.scripts?.start) {
      issues.push(`Missing start script in ${samplePkg}`)
    }
    if (!pkg.scripts?.test) {
      issues.push(`Missing test script in ${samplePkg}`)
    }
  }
}

if (issues.length > 0) {
  console.error("Docs policy check failed:")
  issues.forEach((issue) => console.error(`- ${issue}`))
  process.exit(1)
}

console.log("Docs policy checks passed")
