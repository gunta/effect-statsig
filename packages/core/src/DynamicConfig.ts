import { Context, Effect } from "effect"
import { DynamicConfigError } from "./errors"
import { DynamicConfigValue } from "./types"

export interface DynamicConfigService {
  readonly get: (input: { readonly config: string }) => Effect.Effect<DynamicConfigValue, DynamicConfigError>
}

export class DynamicConfig extends Context.Tag("@effect-statsig/core/DynamicConfig")<DynamicConfig, DynamicConfigService>() {}
