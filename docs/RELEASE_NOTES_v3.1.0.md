# OptionViz v3.1.0 Release Notes

## Email/Password Authentication & Guest Session Management

**Release Date:** March 16, 2026  
**Platform:** iOS / Android (Expo React Native)  
**GitHub:** [BMWeinstein7/Option-Viz-MOBILE](https://github.com/BMWeinstein7/Option-Viz-MOBILE)

---

## What's New in v3.1.0

### Secure Email/Password Authentication

Replaced the previous OIDC-based authentication with a streamlined email/password system powered by bcryptjs (12 salt rounds). Users can now register and sign in directly within the app with no external redirects or third-party login pages.

- **Sign In / Sign Up toggle** — clean form UI with email, password, and optional first/last name fields
- **Password visibility toggle** — eye icon to show/hide password
- **Input validation** — client-side and server-side validation with clear error messages
- **Secure session tokens** — stored in expo-secure-store on mobile, httpOnly cookies on web
- **Type-safe API inputs** — all auth endpoints validate input types to prevent runtime errors

![Auth Screen](images/auth-screen.png)

---

### Guest Mode with 30-Minute Inactivity Timeout

Guest users can explore the full app without creating an account. After 30 minutes of inactivity, guest data (strategies and trades) is automatically cleared to keep the experience fresh.

- **Activity tracking** — guest activity timestamps stored in AsyncStorage
- **Foreground check** — timeout evaluated on app launch and when returning from background
- **Seamless login from sidebar** — guest users see a "Log In / Sign Up" button in the profile menu to create an account at any time

---

### Updated Profile Menu

The profile sidebar now adapts to the user's authentication state:

- **Signed-in users** — see their name, email, portfolio stats, and a "Sign Out" button
- **Guest users** — see "Guest" label, "Not signed in" status, and a prominent "Log In / Sign Up" button that opens the auth form in a modal

![Portfolio Dashboard](images/portfolio-screen.png)

---

### Enhanced Analytics Events

New analytics events added for comprehensive user behavior tracking:

| Event | Description |
|-------|-------------|
| `GUEST_SESSION_EXPIRED` | Fired when 30-min guest timeout triggers |
| `GUEST_SESSION_STARTED` | Fired when user enters guest mode |
| `PROFILE_MENU_LOGIN_TAPPED` | Fired when guest taps "Log In" from sidebar |
| `APP_OPENED` | Fired on every app launch |
| `APP_BACKGROUNDED` | Fired when app goes to background |

---

## App Screens

### Strategy Builder
Build options strategies from 12+ templates or create custom multi-leg combinations. Each leg displays live bid/ask/midpoint pricing with editable contract quantities.

![Strategy Builder](images/builder-screen.png)

### P&L Analysis with Time-Decay Curves
Interactive profit/loss charts with 75%/50%/25% DTE time-decay overlay lines. Greeks (Delta, Gamma, Theta, Vega) displayed per-leg and as net totals.

![P&L Chart](images/pnl-chart.png)

### Live Market Data
Real-time streaming stock quotes via SSE, full options chain with calls/puts, and options flow analysis with put/call ratio visualization.

![Market Screen](images/market-screen.png)

### Portfolio Management
Track open and closed trades with live unrealized P&L. Summary dashboard shows total realized P&L, win rate, and trade counts.

![Portfolio Dashboard](images/portfolio-screen.png)

### Performance Analytics & PDF Export
Dedicated performance tab with total P&L, win rate percentage, average gain/loss, top 5 winners/losers ranked by dollar and percentage return. Export comprehensive PDF reports with OptionViz branding.

![Performance Analytics](images/performance-screen.png)

---

## API Changes

### New Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register with email, password, optional first/last name |
| `POST` | `/api/auth/login` | Login with email and password |
| `POST` | `/api/auth/logout` | Clear session and sign out |

### Removed Endpoints
| Method | Endpoint | Reason |
|--------|----------|--------|
| `GET` | `/api/login` | OIDC login flow removed |
| `GET` | `/api/callback` | OIDC callback removed |
| `GET` | `/api/logout` | Replaced by POST /api/auth/logout |
| `POST` | `/api/mobile-auth/token-exchange` | OIDC token exchange removed |
| `POST` | `/api/mobile-auth/logout` | Consolidated into /api/auth/logout |

---

## Dependencies

### Added
- `bcryptjs` — password hashing with 12 salt rounds

### Removed
- `openid-client` — OIDC client library (server)
- `expo-auth-session` — OIDC auth session (mobile)
- `expo-web-browser` — browser redirect for OIDC (mobile)

---

## Database Changes

- Added `passwordHash` column to `users` table (varchar, nullable)
- Existing users without passwords can set one via the register flow

---

## Technical Details

- **Security**: bcryptjs with cost factor 12, server-side session storage (in-memory Map), httpOnly secure cookies, type-checked API inputs
- **Mobile auth storage**: expo-secure-store for session tokens, sent as `Authorization: Bearer` header
- **Guest timeout**: 30-minute window tracked via `GUEST_LAST_ACTIVE_KEY` in AsyncStorage, checked on launch and AppState foreground events
- **TypeScript**: Full typecheck passes across both `@workspace/api-server` and `@workspace/mobile`

---

## Full Feature List (v3.1.0)

- 12+ strategy templates (Long Call/Put, Bull/Bear Spreads, Iron Condor, Iron Butterfly, Straddle, Strangle, Covered Call, Protective Put, Collar, Calendar Spread)
- Custom strategy builder with add/remove legs
- P&L charts with time-decay curves (75%/50%/25% DTE)
- Greeks visualization (Delta, Gamma, Theta, Vega)
- Live midpoint pricing with auto-refresh
- Editable contract quantities
- SSE streaming market data
- Full options chain with flow analysis
- Email/password authentication with bcrypt
- Guest mode with 30-minute timeout
- Server-side strategy persistence (PostgreSQL)
- Trade tracking with live unrealized P&L
- Performance dashboard with PDF export
- Profile menu with adaptive auth state
- Liquid Glass dark theme (Tiffany blue #0ABAB5)
