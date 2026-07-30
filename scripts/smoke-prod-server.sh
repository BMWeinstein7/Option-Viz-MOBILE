#!/usr/bin/env bash
# Production-bundle smoke test for the API server.
#
# The dev server (tsx, ESM) never exercises the esbuild CJS bundle, so
# ESM/CJS interop bugs (e.g. yahoo-finance2 default-export wrapping) only
# surface at publish time. This script builds the production bundle, boots
# it on a test port, and asserts /api/healthz returns 200.
#
# Run this before publishing:  bash scripts/smoke-prod-server.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${SMOKE_PORT:-4198}"
BUNDLE="$ROOT/artifacts/api-server/dist/index.cjs"
LOG="$(mktemp /tmp/api-server-smoke.XXXXXX.log)"

echo "==> Building production bundle..."
pnpm --filter @workspace/api-server run build

echo "==> Starting node $BUNDLE on port $PORT..."
PORT="$PORT" node "$BUNDLE" >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

fail() {
  echo ""
  echo "!! SMOKE TEST FAILED: $1"
  echo "---- server output ($LOG) ----"
  cat "$LOG"
  echo "-------------------------------"
  exit 1
}

for i in $(seq 1 30); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    fail "server process crashed on startup"
  fi
  STATUS="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/healthz" || true)"
  if [ "$STATUS" = "200" ]; then
    echo "==> /api/healthz returned 200 — production bundle is healthy."
    exit 0
  fi
  sleep 0.5
done

fail "/api/healthz did not return 200 within 15s (last status: ${STATUS:-none})"
