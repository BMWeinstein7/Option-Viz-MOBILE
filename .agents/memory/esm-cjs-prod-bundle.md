---
name: ESM-only deps crash the CJS production bundle
description: ESM-only packages (e.g. yahoo-finance2) break default-export interop in the api-server's esbuild CJS prod build
---
The api-server is bundled to CJS via esbuild for publishing; deps outside the build.ts allowlist stay external and get `require()`d. ESM-only packages then deliver a wrapped default export ("X is not a constructor" at startup), so the deploy fails at the promote/health-check step while dev (tsx, ESM) works fine.

**Why:** esbuild's `__toESM` interop + Node's require(ESM) returns the module namespace as `.default`.

**How to apply:** After adding any server dependency, smoke-test the prod build locally: `pnpm --filter @workspace/api-server run build && PORT=8123 node artifacts/api-server/dist/index.cjs` then curl `/api/healthz`. For ESM-only deps, unwrap defensively (`(Mod as any).default ?? Mod`) or add them to the bundle allowlist.
