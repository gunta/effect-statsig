import { Context, Effect } from "effect"
import { ExperimentError } from "./errors"
import { ExperimentValue, LayerValue } from "./types"

export interface ExperimentsService {
  readonly get: (input: { readonly experiment: string }) => Effect.Effect<ExperimentValue, ExperimentError>
  readonly getLayer: (input: { readonly layer: string }) => Effect.Effect<LayerValue, ExperimentError>
}

export class Experiments extends Context.Tag("@effect-statsig/core/Experiments")<Experiments, ExperimentsService>() {}
