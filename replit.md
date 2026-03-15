# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains an Expo React Native mobile app (OptionViz) and an Express API server providing options strategy analysis and market data.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Mobile**: Expo React Native (SDK 53)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (market data + strategy analysis)
│   └── mobile/             # Expo React Native app (OptionViz)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## GitHub Repository

- **Repo**: https://github.com/BMWeinstein7/Option-Viz-MOBILE
- **Branch**: master
- **Release**: v1.0.0

## OptionViz Mobile App

### Features
- 12+ strategy templates (Long Call/Put, spreads, income, volatility, neutral, hedging)
- P&L charts with time-decay curves (75%/50%/25% DTE) via per-leg Black-Scholes
- Greeks visualization (Delta, Gamma, Theta, Vega)
- Live auto-refreshing market data for any US stock ticker
- Full options chain with flow analysis and put/call ratio
- Portfolio tracking (strategies + trades)

### App Tabs
- **Builder** (`app/(tabs)/index.tsx`) — 4-step strategy wizard: ticker → strategy → legs → analysis
- **Market** (`app/(tabs)/market.tsx`) — 3 views: Live Quotes, Chain, Flow
- **Portfolio** (`app/(tabs)/portfolio.tsx`) — saved strategies and trades

### API Endpoints
- `GET /api/market/quote/:ticker` — single quote
- `POST /api/market/batch-quotes` — batch quotes
- `GET /api/market/chain/:ticker` — options chain
- `GET /api/market/flow/:ticker` — options flow
- `GET /api/market/pcr/:ticker` — put/call ratio
- `GET /api/market/stream/:ticker` — SSE streaming quotes
- `POST /api/strategy/analyze` — strategy P&L analysis with time-decay curves

### Key Files
- `api-server/src/lib/marketData.ts` — market data generation (any ticker via hash-based fallback)
- `api-server/src/routes/market.ts` — all market endpoints
- `api-server/src/routes/strategy.ts` — Black-Scholes strategy analysis
- `mobile/components/PnLChart.tsx` — SVG P&L chart with time-decay overlays
- `mobile/constants/strategies.ts` — 12+ strategy template definitions
- `mobile/hooks/useApi.ts` — API client with React Query hooks

### Theme
- Background: #0A0E1A, Card: #111827, Green: #22c55e, Red: #ef4444, Blue: #3b82f6, Gold: #f59e0b

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; JS bundling by esbuild/tsx/vite

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with market data and strategy analysis routes.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- Routes: `src/routes/market.ts` (quotes, chain, flow, PCR, SSE), `src/routes/strategy.ts` (P&L analysis)
- `pnpm --filter @workspace/api-server run dev`

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app (OptionViz).

- Uses React Query for data fetching with auto-refresh intervals
- `pnpm --filter @workspace/mobile run dev`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.
