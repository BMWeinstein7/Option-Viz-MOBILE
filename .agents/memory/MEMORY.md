# Memory Index

- [pnpm catalog gaps break new artifact scaffolds](pnpm-catalog-scaffolds.md) — new scaffolds may need missing `catalog:` entries added to pnpm-workspace.yaml (e.g. wouter for slides).
- Market data engine was fully synthetic (seeded randomness + Black-Scholes) until the live-data task; verify data source before claiming prices are real.

- [Market data provider choice](market-data-provider.md) — live prices via yahoo-finance2 (no key; Schwab connector needs manual setup); simulated engine is the explicit, logged fallback.
- [brace-expansion security shim](brace-expansion-shim.md) — v1/v2 CVEs only fixed in v5 (renamed export); overrides point to lib/brace-expansion-compat wrapper. pnpm install rewrites pnpm-workspace.yaml, stripping comments.
