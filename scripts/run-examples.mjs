import { execSync } from "node:child_process"

const examples = [
  "core-contracts",
  "statsig-shared",
  "node-server",
  "react-spa",
  "nextjs-app",
  "cloudflare-worker",
  "expo-app",
  "buildtime-flags"
]

for (const example of examples) {
  const dir = `examples/${example}`
  console.log(`Running sample test: ${dir}`)
  execSync("pnpm run test", { cwd: dir, stdio: "inherit" })
}

console.log("All sample tests passed")
