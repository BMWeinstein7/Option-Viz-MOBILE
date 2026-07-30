---
name: Market data provider choice
description: Why live prices come from Yahoo Finance (yahoo-finance2) and how the simulated fallback works
---

The API server serves live quotes/expirations/options chains via the `yahoo-finance2` npm package (no API key; it handles Yahoo's crumb/cookie auth that raw `query2.finance.yahoo.com/v7/finance/options` 401s on).

**Why:** The Schwab connector in the Replit catalog is `requires_setup` (manual credential setup, heavy friction), and Yahoo covers quotes + full options chains for free. Yahoo returns IV per contract but no greeks — greeks are computed with the local Black-Scholes helper.

**Secondary live provider:** Finnhub (optional, enabled by setting the `FINNHUB_API_KEY` secret) is tried after Yahoo and before simulated — but only for stock quotes; Finnhub's free tier has no options chains, so options ops still fall Yahoo → simulated. Finnhub returns `c=0` for unknown symbols instead of an error, and its quote endpoint lacks volume/market cap.

**How to apply:** Live provider is primary; the simulated engine is an explicit fallback (logged, rate-limited warnings) and can be forced with `MARKET_DATA_PROVIDER=simulated`. Responses carry `source: "live" | "simulated"`. Short in-memory caches (quote ~3s, chain ~30s) protect against SSE polling and flow/PCR fan-out hammering Yahoo.
