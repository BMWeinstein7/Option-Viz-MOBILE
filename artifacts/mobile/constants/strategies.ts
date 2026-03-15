export interface StrategyLeg {
  action: "buy" | "sell";
  type: "call" | "put";
  strikeOffset: number; // offset from ATM
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
    description: "Profit from upward movement with limited risk",
    outlook: "bullish",
    legs: [{ action: "buy", type: "call", strikeOffset: 5, quantity: 1, label: "Long Call" }],
  },
  {
    id: "long-put",
    name: "Long Put",
    category: "Basic",
    description: "Profit from downward movement with limited risk",
    outlook: "bearish",
    legs: [{ action: "buy", type: "put", strikeOffset: -5, quantity: 1, label: "Long Put" }],
  },
  {
    id: "covered-call",
    name: "Covered Call",
    category: "Income",
    description: "Generate income on a stock you own",
    outlook: "neutral",
    legs: [{ action: "sell", type: "call", strikeOffset: 10, quantity: 1, label: "Short Call" }],
  },
  {
    id: "protective-put",
    name: "Protective Put",
    category: "Hedging",
    description: "Protect a long stock position from decline",
    outlook: "bullish",
    legs: [{ action: "buy", type: "put", strikeOffset: -5, quantity: 1, label: "Long Put" }],
  },
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    category: "Spreads",
    description: "Bullish play with defined risk and reward",
    outlook: "bullish",
    legs: [
      { action: "buy", type: "call", strikeOffset: 0, quantity: 1, label: "Long Call" },
      { action: "sell", type: "call", strikeOffset: 10, quantity: 1, label: "Short Call" },
    ],
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    category: "Spreads",
    description: "Bearish play with defined risk and reward",
    outlook: "bearish",
    legs: [
      { action: "buy", type: "put", strikeOffset: 0, quantity: 1, label: "Long Put" },
      { action: "sell", type: "put", strikeOffset: -10, quantity: 1, label: "Short Put" },
    ],
  },
  {
    id: "straddle",
    name: "Long Straddle",
    category: "Volatility",
    description: "Profit from big moves in either direction",
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
    description: "Cheaper volatility play with wider break-evens",
    outlook: "volatile",
    legs: [
      { action: "buy", type: "call", strikeOffset: 10, quantity: 1, label: "Long Call" },
      { action: "buy", type: "put", strikeOffset: -10, quantity: 1, label: "Long Put" },
    ],
  },
  {
    id: "iron-condor",
    name: "Iron Condor",
    category: "Income",
    description: "Collect premium in a neutral market",
    outlook: "neutral",
    legs: [
      { action: "sell", type: "put", strikeOffset: -10, quantity: 1, label: "Short Put" },
      { action: "buy", type: "put", strikeOffset: -20, quantity: 1, label: "Long Put" },
      { action: "sell", type: "call", strikeOffset: 10, quantity: 1, label: "Short Call" },
      { action: "buy", type: "call", strikeOffset: 20, quantity: 1, label: "Long Call" },
    ],
  },
  {
    id: "iron-butterfly",
    name: "Iron Butterfly",
    category: "Income",
    description: "Profit when price stays near current level",
    outlook: "neutral",
    legs: [
      { action: "sell", type: "put", strikeOffset: 0, quantity: 1, label: "Short Put ATM" },
      { action: "buy", type: "put", strikeOffset: -10, quantity: 1, label: "Long Put" },
      { action: "sell", type: "call", strikeOffset: 0, quantity: 1, label: "Short Call ATM" },
      { action: "buy", type: "call", strikeOffset: 10, quantity: 1, label: "Long Call" },
    ],
  },
  {
    id: "butterfly",
    name: "Butterfly Spread",
    category: "Neutral",
    description: "Profit if price stays near strike at expiry",
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
    description: "Profit from time decay difference between expirations",
    outlook: "neutral",
    legs: [
      { action: "sell", type: "call", strikeOffset: 0, quantity: 1, label: "Front Month Call" },
      { action: "buy", type: "call", strikeOffset: 0, quantity: 1, label: "Back Month Call" },
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
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
  "TSLA", "META", "AMD", "SPY", "QQQ",
  "NFLX", "IWM", "JPM", "V", "DIS",
];
