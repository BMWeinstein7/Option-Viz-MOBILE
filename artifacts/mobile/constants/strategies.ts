export interface StrategyLeg {
  action: "buy" | "sell";
  type: "call" | "put";
  strikeOffset: number;
  quantity: number;
  label: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  legs: StrategyLeg[];
  outlook: "bullish" | "bearish" | "neutral" | "volatile";
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: "long-call",
    name: "Long Call",
    category: "Basic",
    description: "Bullish bet with limited downside. Profits when stock rises above strike.",
    outlook: "bullish",
    legs: [{ action: "buy", type: "call", strikeOffset: 0, quantity: 1, label: "Long Call" }],
  },
  {
    id: "long-put",
    name: "Long Put",
    category: "Basic",
    description: "Bearish bet with limited downside. Profits when stock falls below strike.",
    outlook: "bearish",
    legs: [{ action: "buy", type: "put", strikeOffset: 0, quantity: 1, label: "Long Put" }],
  },
  {
    id: "covered-call",
    name: "Covered Call",
    category: "Income",
    description: "Own shares and sell a call for income. Caps upside but generates premium.",
    outlook: "neutral",
    legs: [{ action: "sell", type: "call", strikeOffset: 5, quantity: 1, label: "Short Call" }],
  },
  {
    id: "protective-put",
    name: "Protective Put",
    category: "Hedging",
    description: "Own shares and buy a put for downside protection. Like insurance for your stock.",
    outlook: "bullish",
    legs: [{ action: "buy", type: "put", strikeOffset: -5, quantity: 1, label: "Long Put" }],
  },
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    category: "Spreads",
    description: "Buy a lower strike call, sell a higher strike call. Limited risk and reward.",
    outlook: "bullish",
    legs: [
      { action: "buy", type: "call", strikeOffset: -5, quantity: 1, label: "Long Call" },
      { action: "sell", type: "call", strikeOffset: 5, quantity: 1, label: "Short Call" },
    ],
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    category: "Spreads",
    description: "Buy a higher strike put, sell a lower strike put. Limited risk and reward.",
    outlook: "bearish",
    legs: [
      { action: "buy", type: "put", strikeOffset: 5, quantity: 1, label: "Long Put" },
      { action: "sell", type: "put", strikeOffset: -5, quantity: 1, label: "Short Put" },
    ],
  },
  {
    id: "straddle",
    name: "Long Straddle",
    category: "Volatility",
    description: "Buy call and put at same strike. Profits from large moves either direction.",
    outlook: "volatile",
    legs: [
      { action: "buy", type: "call", strikeOffset: 0, quantity: 1, label: "Long Call" },
      { action: "buy", type: "put", strikeOffset: 0, quantity: 1, label: "Long Put" },
    ],
  },
  {
    id: "strangle",
    name: "Long Strangle",
    category: "Volatility",
    description: "Buy OTM call and OTM put. Cheaper than straddle, needs bigger move.",
    outlook: "volatile",
    legs: [
      { action: "buy", type: "call", strikeOffset: 5, quantity: 1, label: "OTM Call" },
      { action: "buy", type: "put", strikeOffset: -5, quantity: 1, label: "OTM Put" },
    ],
  },
  {
    id: "iron-condor",
    name: "Iron Condor",
    category: "Income",
    description: "Sell OTM call spread and OTM put spread. Profits from low volatility.",
    outlook: "neutral",
    legs: [
      { action: "buy", type: "put", strikeOffset: -10, quantity: 1, label: "Long Put Wing" },
      { action: "sell", type: "put", strikeOffset: -5, quantity: 1, label: "Short Put" },
      { action: "sell", type: "call", strikeOffset: 5, quantity: 1, label: "Short Call" },
      { action: "buy", type: "call", strikeOffset: 10, quantity: 1, label: "Long Call Wing" },
    ],
  },
  {
    id: "iron-butterfly",
    name: "Iron Butterfly",
    category: "Income",
    description: "Sell ATM call & put, buy OTM wings. Max profit if stock stays at strike.",
    outlook: "neutral",
    legs: [
      { action: "buy", type: "put", strikeOffset: -10, quantity: 1, label: "Long Put Wing" },
      { action: "sell", type: "put", strikeOffset: 0, quantity: 1, label: "Short Put ATM" },
      { action: "sell", type: "call", strikeOffset: 0, quantity: 1, label: "Short Call ATM" },
      { action: "buy", type: "call", strikeOffset: 10, quantity: 1, label: "Long Call Wing" },
    ],
  },
  {
    id: "butterfly",
    name: "Call Butterfly",
    category: "Neutral",
    description: "Buy 1 lower call, sell 2 ATM, buy 1 higher. Profits if stock stays near center.",
    outlook: "neutral",
    legs: [
      { action: "buy", type: "call", strikeOffset: -10, quantity: 1, label: "Lower Wing" },
      { action: "sell", type: "call", strikeOffset: 0, quantity: 2, label: "Short Middle" },
      { action: "buy", type: "call", strikeOffset: 10, quantity: 1, label: "Upper Wing" },
    ],
  },
  {
    id: "calendar-spread",
    name: "Calendar Spread",
    category: "Volatility",
    description: "Sell near-term call, buy longer-term call at same strike. Profits from time decay.",
    outlook: "neutral",
    legs: [
      { action: "sell", type: "call", strikeOffset: 0, quantity: 1, label: "Front Month" },
      { action: "buy", type: "call", strikeOffset: 0, quantity: 1, label: "Back Month" },
    ],
  },
];

export const OUTLOOK_COLORS: Record<string, string> = {
  bullish: "#22c55e",
  bearish: "#ef4444",
  neutral: "#3b82f6",
  volatile: "#f59e0b",
};

export const OUTLOOK_LABELS: Record<string, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
  volatile: "Volatile",
};

export const POPULAR_TICKERS = [
  "SPY", "QQQ", "AAPL", "TSLA", "NVDA", "AMZN", "META", "MSFT", "AMD", "GOOGL",
  "IWM", "NFLX", "SOFI", "BAC", "PLTR", "INTC", "DIS", "NIO", "F",
  "GLD", "SLV", "XLE", "COIN", "MARA", "RIOT", "BABA", "PYPL", "UBER",
  "JPM", "WFC", "C", "GS", "V", "MA", "CRM", "ORCL", "AVGO", "MU",
  "SMCI", "ARM", "MSTR", "SNOW", "SQ", "SHOP", "ROKU", "SNAP", "PINS", "RBLX",
  "GME", "AMC", "RIVN", "LCID", "DKNG", "PENN", "WYNN", "LVS",
  "XOM", "CVX", "OXY", "DVN", "HAL", "KO", "PEP", "MCD", "SBUX",
  "WMT", "TGT", "COST", "HD", "LOW", "LMT", "BA", "RTX", "GE", "CAT",
  "JNJ", "PFE", "MRNA", "ABBV", "UNH", "LLY", "BMY", "MRK", "GILD",
  "TLT", "HYG", "EEM", "EWZ", "FXI", "KWEB", "SOXL", "TQQQ", "SQQQ", "ARKK",
];
