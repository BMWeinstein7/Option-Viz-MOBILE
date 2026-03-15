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
- **Auth**: Session-based (express-session + connect-pg-simple + bcryptjs)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (market data + strategy analysis + auth)
│   └── mobile/             # Expo React Native app (OptionViz)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection (users, saved_strategies)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## GitHub Repository

- **Repo**: https://github.com/BMWeinstein7/Option-Viz-MOBILE
- **Branch**: master
- **Release**: v2.0.0

## OptionViz Mobile App

### Features (v2.0)
- 12+ strategy templates (Long Call/Put, spreads, income, volatility, neutral, hedging)
- **Custom strategy builder** — add/remove individual legs freely, not just templates
- P&L charts with time-decay curves (75%/50%/25% DTE) via per-leg Black-Scholes
- Greeks visualization (Delta, Gamma, Theta, Vega)
- **Live midpoint pricing** — each leg shows live bid/ask/mid from options chain, auto-updated every 5s
- **Editable contract sizes** — +/- quantity controls on each leg with inline stepper
- **SSE streaming market data** — real-time price updates for any US stock ticker
- Full options chain with flow analysis and put/call ratio
- **User authentication** — welcome screen with Create Account / Sign In / Continue as Guest
- **Server-side strategy persistence** — saved strategies synced to PostgreSQL for logged-in users
- **Profile menu** — hamburger-style drawer with user stats, preferences, sign-out
- **Trade tracking with live P&L** — open trades show unrealized P&L computed from current live midpoints
- **Performance dashboard** — realized P&L summary with timeframe filtering (1W/1M/3M/6M/1Y/ALL)
- **Trade editing** — edit entry costs, close at live prices, delete trades
- **Liquid Glass design** — dark grey #0D0D12 + Tiffany blue #0ABAB5 glassmorphic UI

### App Tabs
- **Builder** (`app/(tabs)/index.tsx`) — 4-step strategy wizard: ticker → strategy → legs (live mid prices, editable qty) → analysis. Can open trade directly from builder with live midpoints as entry.
- **Market** (`app/(tabs)/market.tsx`) — 3 views: Live Quotes (SSE streaming), Chain (calls/puts), Flow (put/call ratio)
- **Portfolio** (`app/(tabs)/portfolio.tsx`) — 3 sub-tabs: Dashboard (performance summary), Saved Strategies, Trades (open/closed with live P&L)

### Auth Flow
- Welcome screen shows first (AuthScreen component)
- Options: Create Account, Sign In, Continue as Guest
- Session-based auth via express-session + connect-pg-simple
- Guest mode uses AsyncStorage for local strategy persistence
- Logged-in mode syncs strategies to server

### Trade Model
```typescript
interface OpenTrade {
  id: string;
  strategyName: string;
  ticker: string;
  openedAt: number;
  closedAt?: number;
  entryNetCost: number;      // calculated from entry midpoints
  entrySpotPrice: number;     // underlying price at entry
  legs: TradeLeg[];           // per-leg entry data
  status: "open" | "closed";
  exitValue?: number;
  realizedPnL?: number;
}
interface TradeLeg {
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  quantity: number;
  expiration: string;
  entryMid: number;           // midpoint at trade open
  entryBid: number;
  entryAsk: number;
}
```

### API Endpoints
- `GET /api/market/quote/:ticker` — single quote
- `POST /api/market/batch-quotes` — batch quotes
- `GET /api/market/expirations/:ticker` — available expirations
- `GET /api/market/chain/:ticker/:expiration` — options chain
- `GET /api/market/flow/:ticker` — options flow
- `GET /api/market/pcr/:ticker` — put/call ratio
- `GET /api/market/stream/:ticker` — SSE streaming quotes
- `POST /api/strategy/analyze` — strategy P&L analysis with time-decay curves
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — session check
- `POST /api/auth/logout` — sign out
- `GET /api/strategies` — list user strategies
- `POST /api/strategies` — save strategy
- `DELETE /api/strategies/:id` — delete strategy

### Key Files
- `api-server/src/lib/marketData.ts` — market data generation (any ticker via hash-based fallback)
- `api-server/src/routes/market.ts` — all market endpoints
- `api-server/src/routes/strategy.ts` — Black-Scholes strategy analysis
- `api-server/src/routes/auth.ts` — authentication routes
- `api-server/src/routes/strategies.ts` — strategy CRUD routes
- `api-server/src/app.ts` — Express app with session middleware + CORS
- `mobile/components/AuthScreen.tsx` — welcome / login / register screen
- `mobile/components/ProfileMenu.tsx` — hamburger profile drawer
- `mobile/components/PnLChart.tsx` — SVG P&L chart with time-decay overlays
- `mobile/components/LegRow.tsx` — leg display with live bid/ask/mid + editable quantity
- `mobile/components/MetricCard.tsx` — metric display card
- `mobile/components/GreeksBar.tsx` — Greeks visualization
- `mobile/context/AppContext.tsx` — auth state, strategy/trade persistence, trade editing
- `mobile/hooks/useApi.ts` — API client with all endpoints
- `mobile/constants/strategies.ts` — 12+ strategy template definitions
- `mobile/constants/colors.ts` — Liquid Glass theme colors
- `lib/db/src/schema/index.ts` — Drizzle schema (users, saved_strategies tables)

### Theme (Liquid Glass)
- Background: #0D0D12, Card: #161620, Elevated: #1C1C28
- Glass: rgba(255,255,255,0.03), Glass Border: rgba(255,255,255,0.08)
- Accent (Tiffany Blue): #0ABAB5, Red: #F43F5E, Blue: #38BDF8, Gold: #FBBF24, Purple: #A78BFA

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; JS bundling by esbuild/tsx/vite

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with market data, strategy analysis, auth, and strategy CRUD routes.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- Routes: market.ts, strategy.ts, auth.ts, strategies.ts
- `pnpm --filter @workspace/api-server run dev`

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app (OptionViz).

- Uses React Query for data fetching with auto-refresh intervals
- `pnpm --filter @workspace/mobile run dev`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Tables: users, saved_strategies, session.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.
