# OptionViz Design Specification

## Design System — Liquid Glass

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0D0D12` | App background, pure dark |
| Card | `#161620` | Card/panel backgrounds |
| Elevated | `#1C1C28` | Raised surfaces, inputs |
| Input | `#1A1A26` | Text input backgrounds |
| Glass | `rgba(255,255,255,0.03)` | Glassmorphic overlays |
| Glass Border | `rgba(255,255,255,0.08)` | Subtle luminous borders |
| Glass Elevated | `rgba(255,255,255,0.05)` | Elevated glass panels |
| Accent (Cyan) | `#0ABAB5` | Primary action, highlights |
| Accent Dim | `rgba(10,186,181,0.12)` | Accent backgrounds |
| Accent Bright | `#2DD4BF` | Hover/active states |
| Red | `#F43F5E` | Loss, errors, destructive |
| Red Dim | `rgba(244,63,94,0.12)` | Red backgrounds |
| Blue | `#38BDF8` | Info, secondary accent |
| Gold | `#FBBF24` | Warnings, neutral |
| Purple | `#A78BFA` | Special highlights |
| Text Primary | `#EAEAF0` | Main text |
| Text Secondary | `#8B8B9E` | Supporting text |
| Text Muted | `#4A4A5E` | Disabled, placeholders |
| Tab Bar | `rgba(13,13,18,0.95)` | Bottom navigation bg |

### Typography

| Style | Font | Weight | Size |
|-------|------|--------|------|
| H1 | Inter | 700 Bold | 28px |
| H2 | Inter | 600 SemiBold | 22px |
| H3 | Inter | 600 SemiBold | 18px |
| Body | Inter | 400 Regular | 15px |
| Body Small | Inter | 400 Regular | 13px |
| Caption | Inter | 500 Medium | 11px |
| Label | Inter | 600 SemiBold | 13px |
| Button | Inter | 600 SemiBold | 16px |
| Tab Label | Inter | 500 Medium | 10px |

### Corner Radii

| Element | Radius |
|---------|--------|
| Cards | 16px |
| Buttons | 14px |
| Input fields | 12px |
| Avatars | 10-16px |
| Pills/Badges | 8px |
| Bottom sheet | 24px (top corners) |

### Glassmorphism Effects

- **Glass panels**: `background: rgba(255,255,255,0.03)`, `border: 1px solid rgba(255,255,255,0.08)`
- **Elevated glass**: `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.08)`
- **Blur**: `backdrop-filter: blur(20px)` on supported surfaces
- **Glow effect**: Cyan accent with `0.12` opacity as background tint on active elements

---

## Screen Designs

### 1. Auth Screen (Login / Register)

**Layout (top to bottom):**
- App icon: 64x64 rounded square, dark background with cyan trending line chart icon
- App name: "OptionViz" — H1, white, centered
- Tagline: "Options Strategy Builder & Visualizer" — Body Small, text-secondary, centered
- Glass card panel (full width - 40px padding):
  - Title: "Welcome Back" (login) or "Create Account" (register) — H2, white
  - Registration only: FIRST NAME + LAST NAME inputs in a row
  - EMAIL input: label in Caption, text-muted. Input bg: #1A1A26, 48px height
  - PASSWORD input: same style, with eye/eye-off toggle icon on right
  - Primary button: full width, bg accent (#0ABAB5), "Log In" or "Sign Up", 52px height
  - Mode toggle: "Don't have an account? **Sign Up**" — Body Small, cyan link
- "Continue as Guest →" — Body Small, text-muted, centered at bottom

### 2. Strategy Builder

**Tab: Builder (first tab icon)**

**Step 1 — Ticker Input:**
- Header: "Strategy Builder" — H1, white
- Subheader: "Choose Any Stock" — H3, white
- Description: "Enter any US ticker symbol" — Body Small, text-secondary
- Search input: full width, icon left, placeholder "AAPL", bg #1A1A26

**Step 2 — Strategy Selection:**
- Section: "Select Strategy" — H3
- Category pills (horizontal scroll): Basic, Spreads, Income, Volatility, Neutral, Hedging
  - Active pill: bg accent, white text
  - Inactive pill: bg glass-elevated, text-secondary
- Strategy grid (2 columns):
  - Cards: glass background, 1px glass-border, icon + name
  - Names: Long Call, Long Put, Bull Call Spread, Bear Put Spread, Iron Condor, Iron Butterfly, Long Straddle, Long Strangle, Covered Call, Protective Put, Calendar Spread, Call Butterfly
- Custom Strategy card: cyan border, "Build from scratch — add individual legs"

**Step 3 — Leg Review:**
- Each leg row: glass card, showing Action (BUY/SELL badge), Type (CALL/PUT), Strike, Expiration
- Live pricing: Bid / Ask / Mid in columns, mid highlighted in cyan
- Quantity stepper: − / count / + inline controls

**Step 4 — Analysis:**
- P&L Chart: SVG line chart in glass card
  - Main line: cyan (#0ABAB5) for expiration P&L
  - Overlay lines: 75% DTE, 50% DTE, 25% DTE in lighter cyan shades
  - Zero line: dashed, subtle
  - Profit zone: above zero, Loss zone: below zero
  - X-axis: stock prices, Y-axis: P&L in dollars
- Greeks row: 4 metric cards (Delta, Gamma, Theta, Vega) — value in white, label in text-muted
- Stats: Max Profit, Max Loss, Breakeven, Risk/Reward — glass cards
- Action buttons: "Save to Portfolio" (outline) + "Open Trade" (filled cyan)

### 3. Market Data

**Tab: Market (second tab icon)**

**Segmented control:** 3 buttons — "Live Quotes", "Chain", "Flow"
- Active: bg accent, white text
- Inactive: transparent, text-secondary

**Live Quotes view:**
- Search bar: "Search any ticker..." placeholder
- Quote card (glass panel):
  - Ticker: H2, white, with "LIVE" badge (cyan bg, tiny white text)
  - Price: H1 size, white
  - Change: Body, green (+) or red (-)
  - "STREAMING" indicator with pulse dot

**Chain view:**
- Expiration selector dropdown
- Toggle: "Calls" / "Puts" buttons
- Table: columns Strike, Bid, Ask, Vol, OI, IV%, Delta
- Alternating row subtle bg difference

**Flow view:**
- Put/Call Ratio display: large number in center
- 4 metric cards: VOL RATIO, OI RATIO, CALL VOL, PUT VOL
- "Options Flow — Highest Volume" section with flow cards

### 4. Portfolio

**Tab: Portfolio (third tab icon)**

**Header:** "Portfolio" — H1, with avatar button top-right (34x34, glass bg, user initial in cyan)

**Realized P&L card:** large glass card
- Label: "Realized P&L" — Caption, text-muted
- Value: H1 size, cyan (+) or red (-)
- Stat row: WIN RATE / OPEN / CLOSED — 3 columns in sub-card

**Open Trades section:**
- Trade cards: glass bg, strategy name (H3), ticker, "OPEN" badge (cyan), unrealized P&L (green/red on right)
- Actions: Edit, Close @ Live, Close Manual, Delete

**Trade History section:**
- Closed trade cards: "CLOSED" badge (gray), realized P&L, entry/exit prices

### 5. Performance

**Tab: Performance (fourth tab icon)**

**Header:** "Performance" — H1

**Total P&L card:** prominent glass card
- Label: "TOTAL REALIZED P&L" — Caption, text-muted
- Value: very large text, cyan

**Metrics grid (2x2):**
- WIN RATE — value in cyan
- TRADES — value in white
- AVG GAIN — value in green
- AVG LOSS — value in red
- Each card: glass bg, label in caption/text-muted, value in large bold

**Top Winners (by $):** glass card, numbered list with strategy names and green dollar amounts
**Top Losers (by $):** glass card, numbered list with strategy names and red dollar amounts
**Top Winners (by %):** same format, percentage values
**Top Losers (by %):** same format

**Export button:** full width, accent bg, "Export PDF" with download icon, 52px height

### 6. Profile Menu (Bottom Sheet)

**Trigger:** Avatar button in header (34x34)

**Drawer:** slides up from bottom, 24px top radius
- Drag handle: 40x4 centered bar, text-muted
- Profile section: 52x52 avatar (glass bg, large initial in cyan) + name (H3) + email (Body Small, text-muted)
- Stats row: Strategies / Open / Closed counts in glass card
- Menu items: Settings, Notifications, Help, About — each with icon + chevron
- Auth button:
  - Signed in: "Sign Out" — red bg dim, red text
  - Guest: "Log In / Sign Up" — accent bg dim, cyan text
- Close button: "Close" — glass bg, text-secondary

---

## Bottom Tab Bar

- Background: `rgba(13,13,18,0.95)` with blur
- 4 tabs: Builder, Market, Portfolio, Performance
- Active: cyan icon + cyan label
- Inactive: text-muted icon + text-muted label
- Icon size: 24px
- Label: 10px Inter Medium

---

## Spacing System

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 20px |
| 2xl | 24px |
| 3xl | 32px |
| Screen padding | 20px horizontal |
| Card padding | 16-20px |
| Section gap | 20-24px |

---

## Component Inventory

| Component | File | Description |
|-----------|------|-------------|
| AuthScreen | `components/AuthScreen.tsx` | Login/register form |
| ProfileMenu | `components/ProfileMenu.tsx` | Profile bottom sheet |
| PnLChart | `components/PnLChart.tsx` | SVG P&L line chart |
| LegRow | `components/LegRow.tsx` | Option leg display |
| MetricCard | `components/MetricCard.tsx` | Stats display card |
| GreeksBar | `components/GreeksBar.tsx` | Greeks visualization |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Error fallback UI |
