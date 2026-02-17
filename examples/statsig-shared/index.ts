import { Either } from "effect"
import { parseStatsigConfig, parseStatsigUser } from "../../packages/statsig/src/index"

const config = parseStatsigConfig({ environment: "prod", clientKey: "client-key" })
const user = parseStatsigUser({ userId: "sample-user", country: "US" })

console.log(`statsig-shared configRight=${Either.isRight(config)} userRight=${Either.isRight(user)}`)
