# Why Effect + Statsig?

> One codebase. Every platform. Type-safe feature flags, experimentation, and analytics — powered by the two most compelling technologies in their respective spaces.

---

## Table of Contents

- [The Problem](#the-problem)
- [Why Effect](#why-effect)
- [Why Statsig](#why-statsig)
- [Why Effect + Statsig Together](#why-effect--statsig-together)
- [Cross-Platform: One Source, Every Runtime](#cross-platform-one-source-every-runtime)
- [Comparison with Alternatives](#comparison-with-alternatives)
- [Who Uses These Technologies](#who-uses-these-technologies)
- [Getting Started](#getting-started)

---

## The Problem

Modern product teams face a compounding set of challenges:

1. **Feature delivery is risky.** Shipping code to production without gradual rollouts, kill switches, or experimentation infrastructure means every deploy is a gamble.
2. **TypeScript's type system lies.** `try/catch` hides errors. `Promise<T>` tells you nothing about failure modes. Dependencies are invisible. Concurrency is a minefield.
3. **Platforms multiply.** Your product runs on Node servers, browser SPAs, React Native apps, Expo apps, Cloudflare Workers, and more — each with its own SDK story, lifecycle quirks, and failure characteristics.
4. **Fragmented tooling.** Teams glue together separate libraries for error handling, dependency injection, retry logic, observability, feature flags, A/B testing, and analytics. Each adds cognitive overhead, bundle size, and integration risk.

**effect-statsig** solves all four by combining the two best-in-class technologies for their respective domains into a single, unified, cross-platform solution.

---

## Why Effect

### What is Effect?

[Effect](https://effect.website) is a TypeScript library and ecosystem for building robust, maintainable applications. Think of it as "what TypeScript should have been" — a comprehensive standard library that leverages the type system to track not just success values, but errors, dependencies, and computational context.

Effect reached **stable 3.0** in April 2024 after 5+ years of development and 3+ years of battle-tested production usage. It now exceeds **6 million npm downloads per week** and **12,000+ GitHub stars**.

Thoughtworks placed Effect on their **Technology Radar in "Trial" status** (April 2025), recommending teams actively try it in production.

### The Core Insight

Every `Effect<Success, Error, Requirements>` value encodes three things in the type system:

| Type Parameter | What It Tracks | What You Get |
|---|---|---|
| `Success` | The happy-path return type | Same as `Promise<T>` |
| `Error` | Every possible failure mode | **Compiler-enforced error handling** |
| `Requirements` | Every dependency needed | **Compile-time dependency injection** |

This single type signature eliminates entire categories of production bugs that TypeScript alone cannot catch.

### Key Benefits

#### 1. Type-Safe Error Handling — No More Hidden Failures

Traditional TypeScript:

```typescript
// What errors can this throw? Nobody knows. The compiler doesn't care.
async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);    // NetworkError?
  if (!res.ok) throw new Error("Not found");       // HTTP error?
  const data = await res.json();                   // ParseError?
  return UserSchema.parse(data);                   // ValidationError?
}
```

With Effect:

```typescript
// The type system tracks EVERY failure mode. The compiler enforces handling.
const getUser = (id: string): Effect.Effect<
  User,
  NetworkError | HttpError | ParseError | ValidationError,
  HttpClient
> => { /* ... */ }
```

You **cannot** ignore errors. The compiler forces you to handle `NetworkError`, `HttpError`, `ParseError`, and `ValidationError` — or explicitly propagate them. No silent failures. No surprise crashes at 3 AM.

#### 2. Dependency Injection — Built Into the Type System

No DI framework needed. No runtime reflection. No decorators. Effect tracks dependencies at the type level and resolves them at composition time:

```typescript
// The type tells you: this needs HttpClient and UserRepo to run
const program: Effect.Effect<void, AppError, HttpClient | UserRepo> = ...

// Provide implementations via Layers — swap for tests trivially
const live = program.pipe(Effect.provide(LiveLayer))
const test = program.pipe(Effect.provide(TestLayer))
```

This makes testing effortless and makes it **impossible to forget a dependency** — the compiler catches it.

#### 3. Resource Safety — Lifecycle Management That Never Leaks

SDK connections, database pools, file handles — Effect guarantees cleanup even when programs fail:

```typescript
const StatsigLive = Layer.scoped(
  StatsigClient,
  Effect.acquireRelease(
    initializeStatsig(config),    // Acquire: initialize SDK
    (client) => shutdown(client)  // Release: ALWAYS runs, even on failure
  )
)
```

No leaked connections. No orphaned SDK instances. No "forgot to call `.close()`" bugs.

#### 4. Structured Concurrency — Safe Parallelism

Effect's fiber-based concurrency model means you can run operations in parallel with automatic cancellation, error propagation, and resource cleanup:

```typescript
// Check a feature gate AND log an event in parallel, safely
const result = Effect.all([
  checkGate("new_checkout"),
  logEvent("page_view", { page: "/checkout" })
], { concurrency: "unbounded" })
```

No race conditions from forgotten `Promise.all` error handling. No zombie promises.

#### 5. Batteries Included — Replace Your Dependency Tree

Effect replaces a constellation of one-off libraries with a single, coherent ecosystem:

| What You Get | What It Replaces |
|---|---|
| `Effect` (error handling) | `neverthrow`, `fp-ts/Either`, manual try/catch |
| `Layer` (dependency injection) | `tsyringe`, `inversify`, `awilix` |
| `Schedule` (retry/backoff) | `p-retry`, `async-retry`, `exponential-backoff` |
| `Schema` (validation) | `zod`, `yup`, `io-ts` |
| `Stream` (reactive) | `rxjs` for many use cases |
| `Cache` (memoization) | `lru-cache`, custom implementations |
| `Logger` / `Tracer` | `winston`, `pino`, `opentelemetry` (partial) |
| `Config` (configuration) | `dotenv` + manual parsing |
| Immutable data structures | `immer`, `immutable.js` |

One ecosystem. One set of conventions. Everything composes.

#### 6. Incremental Adoption — Not All or Nothing

Effect integrates with existing TypeScript code. You can adopt it one function, one module, or one service at a time. Wrap existing Promises, catch existing exceptions, and gradually migrate:

```typescript
// Wrap any Promise-based code
const wrapped = Effect.tryPromise({
  try: () => existingAsyncFunction(),
  catch: (err) => new LegacyApiError({ cause: err })
})
```

---

## Why Statsig

### What is Statsig?

[Statsig](https://statsig.com) is a modern product development platform providing **feature flags**, **A/B testing / experimentation**, **product analytics**, **session replay**, and **web analytics** — all in one unified solution. It was founded by Vijaye Raji (former VP of Engineering at Facebook) and built by engineers from Meta, Microsoft, Uber, and Google.

In **September 2025**, OpenAI acquired Statsig for **$1.1 billion**, with CEO Vijaye Raji joining as technology chief of OpenAI's applications unit. This is arguably the strongest endorsement a feature flagging platform has ever received.

### The Scale

- **1 trillion+ events processed daily**
- **99.99% uptime** SLA
- **Sub-1ms** flag evaluation latency
- **30+ open-source SDKs** across every major platform
- **700M+ weekly active users** served via OpenAI alone

### Key Benefits

#### 1. Free Feature Flags — Actually Free, at Any Scale

Statsig's free "Developer" tier includes:

- **Unlimited feature flag checks** — no per-evaluation fees, ever
- **Unlimited seats** — no per-user pricing
- **2M events/month** for analytics
- **50,000 session replays/month**
- **1-year analytics data retention**
- Full access to feature flags, dynamic configs, A/B testing, and product analytics

No credit card required. 90% of Statsig customers start (and many stay) on the free tier. This is not a bait-and-switch — feature flags are genuinely free at any scale.

Compare this to LaunchDarkly, which caps free usage at ~5,000 monthly active users before costs escalate dramatically, or other platforms that charge per-seat or per-flag-check.

#### 2. All-in-One Platform — Not Just Flags

Most feature flag tools give you flags and nothing else. Statsig gives you the complete product development lifecycle:

| Capability | What It Does |
|---|---|
| **Feature Gates** | Boolean on/off flags with targeting rules |
| **Dynamic Configs** | Remote key-value configuration per segment |
| **Experiments** | Full A/B/n testing with statistical rigor |
| **Autotune** | Multi-armed bandit optimization (auto-picks winners) |
| **Layers** | Mutual exclusion for overlapping experiments |
| **Product Analytics** | Funnels, retention, user journeys |
| **Session Replay** | See exactly what users experienced |
| **Web Analytics** | Page views, referrers, core web vitals |
| **Metrics** | Define, monitor, and alert on business KPIs |

One dashboard. One SDK. One integration point.

#### 3. Experimentation That Actually Works

Statsig's experimentation engine was built by engineers who ran experimentation infrastructure at Facebook and Microsoft — the two companies that pioneered online controlled experiments at scale.

- **Bayesian and frequentist** statistical engines
- **CUPED** (Controlled-experiment Using Pre-Experiment Data) for faster, more sensitive experiments
- **Sequential testing** for early stopping when results are clear
- **Bonferroni corrections** for multiple comparisons
- **Guardrail metrics** to automatically detect regressions
- **Warehouse-native mode** — run experiments directly on your Snowflake, BigQuery, or Databricks data

#### 4. Guarded Releases — Ship Without Fear

Statsig's release management goes beyond simple feature flags:

- **Percentage-based rollouts** with automatic progression schedules
- **Automatic rollback** when monitored metrics exceed thresholds
- **Health checks** built into the release pipeline
- **No-regression validation** before full rollout

Deploy at 1%, watch your metrics, auto-promote to 5%, 25%, 100% — or auto-rollback if error rates spike. All without human intervention.

#### 5. Backed by OpenAI — The Ultimate Vote of Confidence

OpenAI didn't acquire Statsig on a whim. With 700M+ weekly active users, ChatGPT is one of the fastest-growing consumer products in history. Every model update, UI change, and feature needs rigorous testing. OpenAI evaluated building in-house, buying alternatives like LaunchDarkly, and acquiring Statsig — they chose Statsig because:

- It was designed for **high-velocity, AI-native workloads** where outputs are non-deterministic
- It could handle the **scale** of ChatGPT's user base
- Its experimentation engine was built by people who **invented online experimentation at Facebook-scale**
- Statsig continues to operate independently, serving all customers from Seattle

If it's good enough for OpenAI at 700M users, it's good enough for your product.

---

## Why Effect + Statsig Together

The magic happens at the intersection. Combining Effect and Statsig gives you something neither provides alone:

### Type-Safe Feature Flags

```typescript
// The compiler KNOWS this can fail with StatsigError and needs StatsigClient
const isEnabled = (gate: string): Effect.Effect<
  boolean,
  StatsigError,
  FeatureGates
> => FeatureGates.check(gate)
```

No more `if (client && client.initialized && client.checkGate)` defensive coding. The type system guarantees the client is initialized and available.

### Testable Experimentation

```typescript
// Swap the real Statsig layer for a test layer — zero code changes
const TestLayer = FeatureGates.of({
  check: (gate) => Effect.succeed(gate === "new_checkout"),
  getExperiment: (exp) => Effect.succeed({ variant: "control" })
})

// Same program, different layer
const result = await Effect.runPromise(
  myProgram.pipe(Effect.provide(TestLayer))
)
```

Test every branch of every experiment without touching Statsig's servers.

### Scoped Resource Management

```typescript
// SDK lifecycle is managed by Effect — guaranteed cleanup
const StatsigLive = Layer.scoped(
  StatsigClient,
  Effect.acquireRelease(
    Effect.promise(() => Statsig.initialize(sdkKey)),
    () => Effect.promise(() => Statsig.shutdown())
  )
)
```

No more "SDK not initialized" errors. No more leaked connections. No more forgotten shutdown calls.

### Unified Observability

Effect's built-in tracing and logging compose naturally with Statsig's event logging:

```typescript
const checkout = pipe(
  FeatureGates.check("new_checkout_v2"),
  Effect.tap((enabled) =>
    Effect.log(`Checkout gate: ${enabled}`)
  ),
  Effect.flatMap((enabled) =>
    enabled ? newCheckoutFlow : legacyCheckoutFlow
  ),
  Effect.withSpan("checkout.gate-check")
)
```

Every flag check, experiment exposure, and event is traceable end-to-end.

---

## Cross-Platform: One Source, Every Runtime

This is the key insight behind `effect-statsig`: **write your feature flag logic once, run it everywhere**.

### The Architecture

```
                    ┌─────────────────────────────┐
                    │    @effect-statsig/core      │
                    │  Provider-agnostic contracts  │
                    │  (FeatureGates, Experiments,  │
                    │   Analytics, typed errors)     │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────┴────────┐  ┌───────┴───────┐  ┌─────────┴────────┐
    │  @effect-statsig  │  │  @effect-     │  │  @effect-statsig │
    │     /node         │  │  statsig/     │  │   /buildtime     │
    │  (servers, APIs)  │  │  browser      │  │  (compile-time)  │
    └──────────────────┘  └───────┬───────┘  └──────────────────┘
                                  │
                    ┌─────────────┼──────────────┐
                    │             │               │
            ┌───────┴──────┐ ┌───┴────┐  ┌───────┴──────┐
            │  /react      │ │ /expo  │  │ /cloudflare  │
            │  (React SPA) │ │(mobile)│  │  (Workers)   │
            └──────────────┘ └────────┘  └──────────────┘
```

### What This Means in Practice

| Your Code | Platform | Runtime Package |
|---|---|---|
| `FeatureGates.check("new_feature")` | Node.js API server | `@effect-statsig/node` |
| `FeatureGates.check("new_feature")` | Next.js / React SPA | `@effect-statsig/react` |
| `FeatureGates.check("new_feature")` | React Native / Expo mobile app | `@effect-statsig/expo` |
| `FeatureGates.check("new_feature")` | Cloudflare Worker (edge) | `@effect-statsig/cloudflare` |
| `FeatureGates.check("new_feature")` | Static build | `@effect-statsig/buildtime` |

**The application code is identical.** Only the `Layer` you provide changes — and that's a one-line difference at the composition root.

### Single Source: Shared Business Logic

```typescript
// shared/feature-logic.ts — this file works on EVERY platform
import { FeatureGates, Experiments } from "@effect-statsig/core"

export const getCheckoutVariant = Effect.gen(function* () {
  const isPremium = yield* FeatureGates.check("premium_checkout")
  const experiment = yield* Experiments.get("checkout_flow_v2")

  if (isPremium && experiment.variant === "treatment") {
    return "premium-new" as const
  }
  if (isPremium) {
    return "premium-classic" as const
  }
  return experiment.variant === "treatment"
    ? "standard-new" as const
    : "standard-classic" as const
})
```

```typescript
// server.ts — Node.js
import { NodeLayer } from "@effect-statsig/node"
const result = await Effect.runPromise(
  getCheckoutVariant.pipe(Effect.provide(NodeLayer))
)

// app.tsx — React
import { BrowserLayer } from "@effect-statsig/react"
const result = await Effect.runPromise(
  getCheckoutVariant.pipe(Effect.provide(BrowserLayer))
)

// app.tsx — Expo mobile
import { ExpoLayer } from "@effect-statsig/expo"
const result = await Effect.runPromise(
  getCheckoutVariant.pipe(Effect.provide(ExpoLayer))
)
```

**Same logic. Same types. Same error handling. Every platform.**

### Statsig's Cross-Platform SDK Coverage

Statsig provides first-class SDKs for every runtime `effect-statsig` targets:

| Runtime | Statsig SDK | effect-statsig Package |
|---|---|---|
| Node.js / Bun | `@statsig/js-on-device-eval-server` | `@effect-statsig/node` |
| Browser | `@statsig/js-client` | `@effect-statsig/browser` |
| React | `@statsig/react-bindings` | `@effect-statsig/react` |
| React Native | `@statsig/react-native-bindings` | `@effect-statsig/expo` |
| Expo | `@statsig/expo-bindings` | `@effect-statsig/expo` |
| Cloudflare Workers | `@statsig/js-client` (Web Worker mode) | `@effect-statsig/cloudflare` |

All SDKs support feature gates, dynamic configs, experiments, layers, and event logging.

---

## Comparison with Alternatives

### Feature Flag Solutions

| Capability | Statsig | LaunchDarkly | Optimizely | PostHog | Unleash |
|---|---|---|---|---|---|
| Free flags at scale | **Unlimited** | ~5K MAUs | No free tier | 1M events | 2 environments |
| A/B testing | **Built-in, advanced** | Basic add-on | Separate product | Basic | None |
| Product analytics | **Built-in** | None | Separate | Built-in | None |
| Session replay | **Built-in** | None | None | Built-in | None |
| Warehouse-native | **Yes** | No | No | Partial | No |
| Auto-rollback | **Yes** | No | No | No | No |
| Open-source SDKs | **30+** | Partial | No | Yes | Yes |
| Backed by | **OpenAI ($1.1B)** | VC | Episerver | VC | Open source |

### TypeScript Error Handling / Architecture

| Capability | Effect | Plain TS | fp-ts | Zod + DIY |
|---|---|---|---|---|
| Type-safe errors | **Full tracking** | None (`any`) | Either only | None |
| Dependency injection | **Built-in** | Manual/framework | Reader monad | Manual |
| Resource management | **Scoped/guaranteed** | Manual | Manual | Manual |
| Retry/backoff | **Built-in** | Separate lib | Separate lib | Separate lib |
| Concurrency | **Fibers** | Promise.all | Task | Promise.all |
| Observability | **Built-in** | Separate libs | None | Separate libs |
| Schema validation | **Built-in** | Zod/Yup | io-ts | Zod |
| Ecosystem coherence | **Single ecosystem** | 10+ libraries | Partial | Fragmented |
| Production adoption | **X, Vercel, OpenRouter** | Universal | Declining | N/A |

---

## Who Uses These Technologies

### Effect in Production

| Company | Use Case |
|---|---|
| **X (Twitter)** | Platform infrastructure |
| **Vercel** | Domains platform |
| **OpenRouter** | AI platform processing trillions of tokens weekly |
| **Warp** | Payment and payroll systems |
| **MasterClass** | Real-time voice AI orchestration |
| **Spiko** | Event-driven FinTech for regulated products |
| **Salesforce** | Developer tooling |
| **Polar** | Open-source funding platform |
| **T3 Chat** | AI chat application |
| **Zendesk** | Incremental adoption in polyglot environments |

### Statsig in Production

| Company | Impact |
|---|---|
| **OpenAI** | 700M+ weekly active users, ChatGPT experimentation |
| **Notion** | 30x experimentation velocity (single-digit to 300+ experiments/quarter) |
| **HelloFresh** | 1,000 experiments per year |
| **Whatnot** | 0 to 400 annual experiments |
| **Webflow** | Decoupled releases from deployments |
| **Scribd** | Increased subscriber growth via multi-armed bandits |
| **Character.ai** | AI character experimentation at scale |
| **Figma** | Design tool feature rollouts |
| **Brex** | Financial product experimentation |

---

## The Bottom Line

| Question | Answer |
|---|---|
| **Why Effect?** | Because TypeScript alone doesn't protect you from the bugs that matter: unhandled errors, missing dependencies, resource leaks, and concurrency hazards. Effect makes the compiler your safety net. |
| **Why Statsig?** | Because it's the most complete, most proven, most generously-priced feature flag and experimentation platform — now backed by a $1.1B acquisition from the company running the world's most-used AI product. |
| **Why together?** | Because combining Effect's type safety with Statsig's platform gives you **compile-time guarantees** around feature flags, experiments, and analytics — something no other combination offers. |
| **Why this library?** | Because you shouldn't have to write platform-specific glue code. Write your feature logic once, provide the right Layer, and run it on Node, browsers, React, Expo, Cloudflare Workers, or at build time. |

---

## Getting Started

```bash
# Install core + your runtime adapter
pnpm add @effect-statsig/core @effect-statsig/node   # for servers
pnpm add @effect-statsig/core @effect-statsig/react   # for React apps
pnpm add @effect-statsig/core @effect-statsig/expo    # for mobile
```

See the [package documentation](./docs/) and [runnable examples](./examples/) for complete integration guides.

---

*effect-statsig is open source. Contributions, feedback, and questions are welcome.*
