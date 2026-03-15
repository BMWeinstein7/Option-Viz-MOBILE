const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  name: string;
  marketCap?: number;
}

export interface OptionContract {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface OptionsChain {
  ticker: string;
  expiration: string;
  spotPrice: number;
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface PnLPoint {
  price: number;
  pnl: number;
}

export interface TimeDecayCurve {
  dte: number;
  label: string;
  data: PnLPoint[];
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface StrategyAnalysis {
  pnlAtExpiry: PnLPoint[];
  timeDecayCurves: TimeDecayCurve[];
  greeks: Greeks;
  maxProfit: number | null;
  maxLoss: number | null;
  breakEvenPoints: number[];
  netCost: number;
  riskRewardRatio: number | null;
}

export interface StrategyLegRequest {
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
  expiration: string;
}

export interface FlowEntry {
  ticker: string;
  expiration: string;
  strike: number;
  type: "CALL" | "PUT";
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  volOiRatio: number;
  iv: number;
  inTheMoney: boolean;
}

export interface PutCallRatio {
  ticker: string;
  volRatio: number;
  oiRatio: number;
  totalCallVol: number;
  totalPutVol: number;
  totalCallOI: number;
  totalPutOI: number;
}

export const api = {
  getQuote: (ticker: string) => apiFetch<StockQuote>(`/market/quote/${ticker}`),

  getBatchQuotes: (tickers: string[]) =>
    apiFetch<{ quotes: StockQuote[] }>("/market/batch-quotes", {
      method: "POST",
      body: JSON.stringify({ tickers }),
    }),

  getExpirations: (ticker: string) =>
    apiFetch<{ ticker: string; expirations: string[] }>(`/market/expirations/${ticker}`),

  getChain: (ticker: string, expiration: string) =>
    apiFetch<OptionsChain>(`/market/chain/${ticker}/${expiration}`),

  getFlow: (ticker: string) =>
    apiFetch<{ ticker: string; flow: FlowEntry[] }>(`/market/flow/${ticker}`),

  getPutCallRatio: (ticker: string) =>
    apiFetch<PutCallRatio>(`/market/pcr/${ticker}`),

  analyzeStrategy: (payload: {
    ticker: string;
    spotPrice: number;
    riskFreeRate?: number;
    impliedVol?: number;
    legs: StrategyLegRequest[];
  }) =>
    apiFetch<StrategyAnalysis>("/strategy/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getStreamUrl: (ticker: string) => `${BASE}/market/stream/${ticker}`,
};
