export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | ReadonlyArray<JsonValue> | { readonly [key: string]: JsonValue }

export interface UserContext {
  readonly userId: string
  readonly email?: string
  readonly country?: string
  readonly custom?: Readonly<Record<string, JsonValue>>
}

export interface AnalyticsEvent {
  readonly name: string
  readonly user: UserContext
  readonly value?: number
  readonly metadata?: Readonly<Record<string, JsonValue>>
}

export interface ExperimentValue {
  readonly name: string
  readonly variant: string
  readonly parameters: Readonly<Record<string, JsonValue>>
}

export interface LayerValue {
  readonly name: string
  readonly values: Readonly<Record<string, JsonValue>>
}

export interface DynamicConfigValue {
  readonly name: string
  readonly values: Readonly<Record<string, JsonValue>>
}
