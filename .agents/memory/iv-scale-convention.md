---
name: IV scale convention
description: API implied volatility values are percentage points (25 = 25%), not decimal fractions
---

`marketDataLive.ts` normalizes Yahoo IV (`iv * 100`) before storing, so every
`impliedVolatility` / `callIV` / `putIV` value the API serves is already in
percentage points. Frontends must format `25` as `25.0%` — never multiply by
100 again.

**Why:** the Options Charts dashboard initially multiplied by 100 again,
showing 2500% IV; caught in code review.
**How to apply:** any new UI consuming chain or chain-summary IV fields should
format with `.toFixed(1) + "%"` directly.
