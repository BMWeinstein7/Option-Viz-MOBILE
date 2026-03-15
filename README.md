# OptionViz Mobile

A full-featured options strategy builder and visualizer built with Expo React Native.

## Features

### Strategy Builder
- **12+ Strategy Templates** organized by category: Basic (Long Call/Put), Spreads (Bull Call, Bear Put, Iron Condor, Iron Butterfly), Income (Covered Call, Cash-Secured Put), Volatility (Long Straddle, Long Strangle), Neutral (Short Straddle, Short Strangle), and Hedging (Protective Put, Collar)
- **Any US Stock Ticker** — search or tap from 90+ popular symbols; unknown tickers get dynamically generated quotes
- **P&L Charts** with interactive visualization showing profit/loss at expiration
- **Time-Decay Curves** — dashed overlay lines at 75%, 50%, 25% DTE computed via Black-Scholes per-leg pricing
- **Greeks Display** — Delta, Gamma, Theta, Vega for each strategy
- **Break-even Analysis** — automatically calculated break-even points
- **Max Profit / Max Loss** cards with color-coded display

### Market Data (3 Views)
- **Live Quotes** — auto-refreshing every 3-5 seconds, no manual refresh needed. Shows price, change %, company name for all tickers
- **Options Chain** — full chain with strike, bid, ask, volume, open interest, IV%, and delta. Calls/Puts toggle, multiple expiration dates
- **Options Flow** — highest volume flow entries with sentiment tags (Bullish/Bearish/Neutral), plus Put/Call Ratio card showing volume ratio, OI ratio, call/put volume with visual bar

### Portfolio Tracking
- Save analyzed strategies to your portfolio
- Track entry/exit prices and P&L
- Strategies and Trades views

## Tech Stack

- **Frontend**: Expo React Native (SDK 53), React Navigation with native tabs, React Query for data fetching
- **Backend**: Express.js API server with TypeScript
- **Charts**: `react-native-svg` with custom P&L chart component
- **Styling**: Dark navy theme (#0A0E1A background), Inter font family

## Architecture

```
artifacts/
  api-server/          # Express API backend
    src/
      lib/marketData.ts    # Market data generation (any ticker support)
      routes/market.ts     # Quote, chain, flow, PCR, SSE endpoints
      routes/strategy.ts   # Strategy analysis with Black-Scholes
  mobile/              # Expo React Native app
    app/(tabs)/
      index.tsx            # Builder tab (strategy wizard)
      market.tsx           # Market tab (quotes/chain/flow)
      portfolio.tsx        # Portfolio tab
    components/
      PnLChart.tsx         # SVG P&L chart with time-decay curves
    constants/
      strategies.ts        # 12+ strategy template definitions
    hooks/
      useApi.ts            # API client with React Query hooks
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market/quote/:ticker` | GET | Single quote |
| `/api/market/batch-quotes` | POST | Batch quotes for multiple tickers |
| `/api/market/chain/:ticker` | GET | Options chain with Greeks |
| `/api/market/flow/:ticker` | GET | Options flow (highest volume) |
| `/api/market/pcr/:ticker` | GET | Put/Call ratio (volume + OI) |
| `/api/market/stream/:ticker` | GET | SSE streaming quotes (3s interval) |
| `/api/strategy/analyze` | POST | Strategy P&L analysis with time-decay curves |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start API server
pnpm --filter @workspace/api-server run dev

# Start Expo app
pnpm --filter @workspace/mobile run dev
```

## Color Theme

| Element | Color |
|---------|-------|
| Background | `#0A0E1A` |
| Card | `#111827` |
| Accent Green | `#22c55e` |
| Accent Red | `#ef4444` |
| Accent Blue | `#3b82f6` |
| Accent Gold | `#f59e0b` |
| Border | `#1e293b` |

## License

MIT
