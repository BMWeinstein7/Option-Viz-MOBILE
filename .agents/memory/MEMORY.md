# Memory Index

- [pnpm catalog gaps break new artifact scaffolds](pnpm-catalog-scaffolds.md) — new scaffolds may need missing `catalog:` entries added to pnpm-workspace.yaml (e.g. wouter for slides).
- Market data engine was fully synthetic (seeded randomness + Black-Scholes) until the live-data task; verify data source before claiming prices are real.

- [Market data provider choice](market-data-provider.md) — Yahoo (yahoo-finance2) primary; optional Finnhub quotes via FINNHUB_API_KEY (no free options chains); simulated engine is the explicit, logged last resort.
- [ESM-only deps crash the CJS prod bundle](esm-cjs-prod-bundle.md) — smoke-test `node dist/index.cjs` + healthz after adding server deps; unwrap `.default` for ESM-only packages.
- Workspace has two @types/react majors (mobile pins ~19.1 for Expo; catalog is ^19.2); pnpm hoists 19.1 to the root, so web packages' 3rd-party components can see mismatched Ref types — fix locally with casts/typeof props, not version bumps.
- [brace-expansion security shim](brace-expansion-shim.md) — v1/v2 CVEs only fixed in v5 (renamed export); overrides point to lib/brace-expansion-compat wrapper. pnpm install rewrites pnpm-workspace.yaml, stripping comments.
- [Orval codegen gotchas](orval-codegen-gotchas.md) — after codegen run `tsc -b` in lib/api-client-react (stale composite .d.ts); v8 hooks require explicit queryKey in options.query.
- [IV scale convention](iv-scale-convention.md) — API IV values are percentage points (25 = 25%); frontends must never multiply by 100 again.
