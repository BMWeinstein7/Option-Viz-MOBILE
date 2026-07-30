# Threat Model

## Project Overview

OptionViz is a pnpm monorepo comprising:
- **Express 5 API server** (`artifacts/api-server`) — authentication, market data, strategy analysis, strategy CRUD, and SSE streaming endpoints. Deployed publicly at `https://optionviz.app` / `https://option-viz.replit.app` (Replit autoscale, public visibility).
- **Expo React Native mobile app** (`artifacts/mobile`) — iOS/Android client plus a static landing-page Node.js server.
- **Shared libraries** — Drizzle ORM schema (`lib/db`), OpenAPI spec (`lib/api-spec`), generated React Query hooks (`lib/api-client-react`), Zod schemas (`lib/api-zod`).

Users are retail traders who can register (email/password), save options strategies, and stream live market quotes. There is no admin role separate from normal users.

## Assets

- **User credentials** — email addresses, bcrypt-hashed passwords, session IDs (raw 32-byte hex tokens). Session IDs are stored in the DB (`sessionsTable`), in browser cookies, and returned in API login/register JSON responses for Bearer token usage.
- **Session tokens** — provide authentication for all protected API routes. Compromise allows full account impersonation.
- **Saved strategies** — user-specific options strategies stored in PostgreSQL. PII-adjacent (trading behavior).
- **Application secrets** — DATABASE_URL (connection string), any third-party API keys for market data.
- **Market data** — currently generated via deterministic hash fallback; no third-party key exposed in code seen.

## Trust Boundaries

- **Browser/Mobile → API server** — all requests cross this boundary; the API must authenticate every sensitive request server-side. Cookies and Bearer tokens are the auth carriers.
- **API server → PostgreSQL** — Drizzle ORM with parameterized queries; direct access from app server only.
- **Landing page server → browser** — static HTML with Host-header interpolation; values reflected into JS strings in page.
- **Public vs. authenticated** — market endpoints (`/api/market/*`) and strategy analysis (`/api/strategy/analyze`) are unauthenticated. Auth, strategy CRUD require authentication.

## Scan Anchors

- Production entry points: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/` (auth.ts, market.ts, strategies.ts, strategy.ts)
- Highest-risk areas: CORS config in `app.ts`, auth routes in `routes/auth.ts`, session management in `lib/auth.ts`, landing-page server `artifacts/mobile/server/serve.js`
- Public surface: all `/api/market/*` endpoints, `/api/strategy/analyze`
- Authenticated surface: `/api/strategies` (GET/POST/DELETE), `/api/auth/user`
- Dev-only: `artifacts/mockup-sandbox/` (design previews, not production API)

## Threat Categories

### Spoofing

Email/password auth with bcryptjs (12 rounds). Sessions are 32-byte cryptographically random tokens stored DB-side. Token is returned in both a `httpOnly` cookie and the JSON body (`token: sid`) — the latter enables mobile Bearer usage. No refresh token or session rotation on privilege change. No account lockout or login rate limiting, enabling brute-force credential attacks.

**Guarantee:** All authenticated endpoints MUST reject requests without a valid, unexpired session. The `authMiddleware` loads the session on every request.

### Tampering

CORS is configured with `origin: true` (reflects any Origin) plus `credentials: true`. This allows any website to make credentialed cross-origin requests and read the full response — effectively equivalent to wildcard CORS with credentials. An attacker-controlled page can silently call the API with the victim's session cookie and exfiltrate user data or mutate state (save/delete strategies).

Input validation exists for tickers, expiration dates, and leg arrays. Drizzle ORM uses parameterized queries throughout.

**Guarantee:** CORS must restrict allowed origins to the app's own domains. Credentialed cross-origin requests must be accepted only from trusted origins.

### Information Disclosure

The landing page server (`serve.js`) interpolates the `X-Forwarded-Host` / `Host` request header directly into HTML output, including into a JavaScript string (`const deepLink = "exps://EXPS_URL_PLACEHOLDER"`). An attacker who can control the forwarded host header can inject arbitrary JavaScript into the landing page (XSS).

Error messages are generic; no stack traces are exposed in production responses.

**Guarantee:** User-controlled headers must be HTML/JS-escaped before reflection into HTML output.

### Denial of Service

No rate limiting on `/api/auth/login` or `/api/auth/register`. Each login attempt performs a bcrypt compare (cost 12, ~250ms CPU). An attacker can spam login requests to exhaust CPU resources and deny service to legitimate users, or brute-force passwords.

The SSE endpoint (`/api/market/stream/:ticker`) holds connections indefinitely; no maximum connection limit is enforced per client.

**Guarantee:** Auth endpoints MUST implement rate limiting. SSE connections MUST have a maximum per-client limit.

### Elevation of Privilege

No SQL injection found (Drizzle ORM parameterized). The `DELETE /api/strategies/:id` endpoint correctly verifies ownership before deleting (`and(eq(id), eq(userId))`). No admin-only routes exist.

The `parseInt(req.params.id)` in `DELETE /api/strategies/:id` returns `NaN` for non-numeric IDs. Drizzle's `eq(id, NaN)` behavior should be verified but is mitigated by the prior ownership query returning no rows.
