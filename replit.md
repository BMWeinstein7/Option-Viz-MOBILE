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
- **Auth**: Email/password (bcryptjs) with server-side sessions
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
- **Release**: v3.3.0

### Release Notes — v3.3.0 (Current)

#### Security, Accessibility & Responsive Enhancements
- **Ticker input sanitization** — all 7 market routes + SSE stream validate tickers via `sanitizeTicker` regex (`/^[A-Za-z.]{1,10}$/`); rejects invalid formats with 400 BAD_REQUEST
- **Batch quote hardening** — batch-quotes route now filters non-string array elements before processing, preventing `toUpperCase()` crashes on malformed payloads
- **Expiration date validation** — chain route validates `YYYY-MM-DD` format via regex + `Date.parse` guard
- **Strategy input validation** — POST strategies validates ticker format and ensures at least one leg is provided
- **authMiddleware try/catch** — `getSession` and `clearSession` DB calls wrapped in try/catch preventing server crashes on DB connection failures
- **Responsive PnL chart** — replaced hardcoded 340px width with `onLayout` + `useState` for fluid sizing on all screen widths; container uses `width: "100%"`
- **Accessibility labels** — added `accessibilityLabel` and `accessibilityRole` to all interactive elements: LegRow qty buttons, remove button, segment tabs, search buttons, ticker chips, expiration chips, calls/puts toggle, export PDF button
- **LiveQuoteDetail loading state** — shows spinner placeholder instead of blank space while quote data loads
- **Shared formatting** — replaced duplicate `fmtMoney` in builder with import from shared `lib/format.ts`
- **Zero-line color fix** — PnL chart zero-line now uses `Colors.glassBorder` instead of hardcoded `rgba(255,255,255,0.08)`

### Release Notes — v3.2.1

#### Code Quality Refinements & Stability Fixes
- **Race condition prevention** — all strategy/trade state updates use functional updaters (`setState(prev => ...)`) preventing data loss from rapid user actions
- **Corrupt data recovery** — all JSON.parse calls on AsyncStorage wrapped in try/catch; corrupted data auto-cleared instead of crashing
- **Auth route error handling** — register and login routes wrapped in try/catch with 500 responses on DB/bcrypt failures
- **ErrorFallback Liquid Glass** — uses Colors constants instead of hardcoded hex values
- **Shared formatting utilities** — `lib/format.ts` with `fmtMoney`, `fmtDollar`, `fmtPercent`, `fmtPrice`

### Release Notes — v3.2.0

#### Enhanced Trade Execution UI & Complete Documentation
- **Two-tier trade button layout** — primary close actions (Close @ Live, Close Manual) as full-width stacked buttons; secondary actions (Edit, Delete) in a compact row below
- **Close @ Live text fix** — label and dollar value split into separate text elements preventing overflow/clipping
- **Full-width button guarantee** — `alignSelf: "stretch"` on primary buttons for consistent rendering across all devices
- **Delete button label** — now includes "Delete" text label alongside trash icon
- **Complete README** — full rewrite with screenshots, design system, tech stack, architecture, all API endpoints, analytics events
- **Design spec** — `docs/DESIGN_SPEC.md` with every color, typography, spacing, corner radius, and per-screen layout

### Release Notes — v3.1.0

#### Email/Password Authentication & Guest Session Management
- **Email/password auth** — bcryptjs (12 salt rounds) register/login/logout with server-side sessions
- **Sign in / Sign up form** — clean toggle UI with email, password, optional name fields, password visibility toggle
- **Guest session timeout** — 30-minute inactivity timeout clears local guest data (strategies, trades)
- **Profile menu login** — guest users see "Log In / Sign Up" button in sidebar drawer
- **Auth route hardening** — type-checked inputs prevent runtime crashes from malformed payloads
- **OIDC removal** — removed openid-client, expo-auth-session, expo-web-browser dependencies
- **New analytics events** — GUEST_SESSION_EXPIRED, GUEST_SESSION_STARTED, APP_OPENED, APP_BACKGROUNDED, PROFILE_MENU_LOGIN_TAPPED

### Release Notes — v3.0.0

#### Full-Featured Options Strategy Platform
- **12+ strategy templates** — Long Call/Put, Bull/Bear Call & Put Spreads, Iron Condor, Iron Butterfly, Straddle, Strangle, Covered Call, Protective Put, Collar, Calendar Spread, and more
- **Custom strategy builder** — add/remove individual option legs freely beyond templates
- **P&L charts with time-decay curves** — 75%/50%/25% DTE overlays via per-leg Black-Scholes pricing
- **Greeks visualization** — Delta, Gamma, Theta, Vega displayed per-leg and net
- **Live midpoint pricing** — each leg shows live bid/ask/mid from options chain, auto-updated every 5 seconds
- **Editable contract sizes** — +/- quantity controls on each leg with inline stepper
- **SSE streaming market data** — real-time price updates for any US stock ticker

#### Trade Tracking & Portfolio Management
- **Open/close trades** — open trades directly from the builder with live midpoints as entry prices; close at current live prices
- **Live unrealized P&L** — open trades compute unrealized P&L from current live midpoints in real-time
- **Trade editing** — edit entry costs, close at live prices, delete trades
- **Portfolio dashboard** — summary view with Saved Strategies and Trades sub-tabs (open/closed)

#### Performance Analytics & PDF Export
- **Performance tab** — dedicated 4th tab showing total realized P&L, trade count (open/closed), win rate %, average gain/loss, and top 5 winners/losers ranked by both dollar P&L and percentage return
- **Comprehensive PDF reports** — Export PDF generates a professionally styled, print-friendly report with OptionViz branding, stats grid, top winners/losers tables, open positions, all closed trades with entry/exit/P&L, and disclaimer footer
- **Proper file naming** — PDFs saved as `OptionViz_Performance_Report_YYYY-MM-DD_HHMMSS.pdf` with unique timestamps
- **File lifecycle management** — temp files cleaned up after export; robust error handling with user-facing fallback messages

#### Authentication & Cloud Sync
- **Email/password auth** — bcryptjs (12 salt rounds) register/login/logout with server-side sessions
- **Mobile auth flow** — email/password form with sign-in/sign-up toggle, session token stored in expo-secure-store
- **Web session management** — cookie-based sessions with httpOnly secure cookies
- **Server-side strategy persistence** — saved strategies synced to PostgreSQL for logged-in users
- **Guest mode** — full functionality with local AsyncStorage persistence (no account required); 30-minute inactivity timeout clears guest data
- **Profile menu** — hamburger-style drawer with user stats, preferences, sign-out, and "Log In" button for guests

#### Market Data
- **Live Quotes** — real-time streaming stock quotes via SSE
- **Options Chain** — full calls/puts chain for any ticker and expiration
- **Options Flow** — flow analysis with put/call ratio visualization

#### Infrastructure & Stability
- **Expo SDK 54 compatibility** — all packages aligned to SDK-compatible versions (expo-file-system ~19.0.21, react-native-keyboard-controller 1.18.5)
- **HTML safety** — user-controlled strings (tickers, strategy names) HTML-escaped in PDF generation
- **Post-merge script hardening** — non-interactive `push-force` for automated merge runs
- **Liquid Glass design system** — dark grey #0D0D12 + Tiffany blue #0ABAB5 glassmorphic UI throughout

## OptionViz Mobile App

### Features (v2.0)
- 12+ strategy templates (Long Call/Put, spreads, income, volatility, neutral, hedging)
- **Performance dashboard** — dedicated 4th tab showing total P&L, win rate, avg gain/loss, top trades ranked by $ and %, with PDF export via expo-print + expo-sharing
- **Custom strategy builder** — add/remove individual legs freely, not just templates
- P&L charts with time-decay curves (75%/50%/25% DTE) via per-leg Black-Scholes
- Greeks visualization (Delta, Gamma, Theta, Vega)
- **Live midpoint pricing** — each leg shows live bid/ask/mid from options chain, auto-updated every 5s
- **Editable contract sizes** — +/- quantity controls on each leg with inline stepper
- **SSE streaming market data** — real-time price updates for any US stock ticker
- Full options chain with flow analysis and put/call ratio
- **User authentication** — email/password login (bcryptjs); welcome screen with Sign In / Sign Up / Continue as Guest
- **Guest session timeout** — 30-minute inactivity timeout clears local guest data
- **Server-side strategy persistence** — saved strategies synced to PostgreSQL for logged-in users
- **Profile menu** — hamburger-style drawer with user stats, preferences, sign-out, and "Log In" for guests
- **Trade tracking with live P&L** — open trades show unrealized P&L computed from current live midpoints
- **Performance dashboard** — realized P&L summary with timeframe filtering (1W/1M/3M/6M/1Y/ALL)
- **Trade editing** — edit entry costs, close at live prices, delete trades
- **Liquid Glass design** — dark grey #0D0D12 + Tiffany blue #0ABAB5 glassmorphic UI

### App Tabs
- **Builder** (`app/(tabs)/index.tsx`) — 4-step strategy wizard: ticker → strategy → legs (live mid prices, editable qty) → analysis. Can open trade directly from builder with live midpoints as entry.
- **Market** (`app/(tabs)/market.tsx`) — 3 views: Live Quotes (SSE streaming), Chain (calls/puts), Flow (put/call ratio)
- **Portfolio** (`app/(tabs)/portfolio.tsx`) — 3 sub-tabs: Dashboard (performance summary), Saved Strategies, Trades (open/closed with live P&L)

### Auth Flow
- AuthScreen shows first with Sign In / Sign Up toggle + "Continue as Guest"
- Email/password auth with bcryptjs (12 salt rounds) on server
- Mobile stores session token in expo-secure-store, sends as Authorization header
- authMiddleware loads user from session on every request, patches req.isAuthenticated()
- Guest mode uses AsyncStorage for local strategy persistence; 30-minute inactivity timeout
- Profile menu sidebar shows "Log In / Sign Up" button for guest users
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
- `GET /api/auth/user` — get current authenticated user
- `POST /api/auth/register` — register with email/password (+ optional firstName/lastName)
- `POST /api/auth/login` — login with email/password
- `POST /api/auth/logout` — clear session
- `GET /api/strategies` — list user strategies
- `POST /api/strategies` — save strategy
- `DELETE /api/strategies/:id` — delete strategy

### Key Files
- `api-server/src/lib/marketData.ts` — market data generation (any ticker via hash-based fallback)
- `api-server/src/routes/market.ts` — all market endpoints
- `api-server/src/routes/strategy.ts` — Black-Scholes strategy analysis
- `api-server/src/routes/auth.ts` — email/password register, login, logout routes (bcryptjs)
- `api-server/src/lib/auth.ts` — session CRUD (in-memory Map store)
- `api-server/src/middlewares/authMiddleware.ts` — loads user from session, patches req.isAuthenticated()
- `api-server/src/routes/strategies.ts` — strategy CRUD routes
- `api-server/src/app.ts` — Express app with cookie-parser + authMiddleware + CORS
- `mobile/lib/auth.tsx` — AuthProvider with email/password auth + SecureStore token
- `mobile/components/AuthScreen.tsx` — sign-in/sign-up form with email, password, name fields
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

Database layer using Drizzle ORM with PostgreSQL. Tables: users (varchar id, email, passwordHash, firstName, lastName, profileImageUrl), saved_strategies.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.
