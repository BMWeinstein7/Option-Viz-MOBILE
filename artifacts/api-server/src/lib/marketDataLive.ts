import YahooFinance from "yahoo-finance2";
import type {
  QuoteData,
  OptionContractData,
  OptionsChainData,
  FlowEntry,
  PutCallRatio,
} from "./marketTypes.js";
import { blackScholes } from "./blackScholes.js";

// yahoo-finance2 is ESM-only; when this server is bundled to CJS for
// production, the default export arrives wrapped (module namespace) instead
// of the class. Unwrap defensively so both dev (ESM) and prod (CJS) work.
const YahooFinanceCtor: typeof YahooFinance =
  (YahooFinance as unknown as { default?: typeof YahooFinance }).default ??
  YahooFinance;

const yf = new YahooFinanceCtor({ suppressNotices: ["yahooSurvey"] });

// Short-lived caches to avoid hammering the provider (SSE polls every 3s,
// flow/PCR fan out over multiple expirations).
const QUOTE_TTL_MS = 1_500;
const CHAIN_TTL_MS = 5_000;
const EXPIRATIONS_TTL_MS = 5 * 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const quoteCache = new Map<string, CacheEntry<QuoteData>>();
const chainCache = new Map<string, CacheEntry<OptionsChainData>>();
const expirationsCache = new Map<string, CacheEntry<string[]>>();

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = map.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  if (entry) map.delete(key);
  return null;
}

function setCached<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttl: number): void {
  map.set(key, { value, expiresAt: Date.now() + ttl });
  if (map.size > 500) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
}

// In-flight request dedup: when a cache entry expires while several
// consumers poll the same key (e.g. flow/PCR fan out over expirations),
// only one upstream Yahoo request is made and everyone shares the result.
const inFlight = new Map<string, Promise<unknown>>();

function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function fetchStockQuote(ticker: string): Promise<QuoteData> {
  const upper = ticker.toUpperCase();
  const cached = getCached(quoteCache, upper);
  if (cached) return cached;
  return dedup(`quote:${upper}`, () => fetchStockQuoteUncached(upper));
}

async function fetchStockQuoteUncached(upper: string): Promise<QuoteData> {
  const q = await yf.quote(upper);
  if (q?.regularMarketPrice == null) {
    throw new Error(`No live quote for ${upper}`);
  }

  const quote: QuoteData = {
    ticker: upper,
    price: round2(q.regularMarketPrice),
    change: round2(q.regularMarketChange ?? 0),
    changePercent: round2(q.regularMarketChangePercent ?? 0),
    volume: q.regularMarketVolume ?? 0,
    high: round2(q.regularMarketDayHigh ?? q.regularMarketPrice),
    low: round2(q.regularMarketDayLow ?? q.regularMarketPrice),
    open: round2(q.regularMarketOpen ?? q.regularMarketPrice),
    previousClose: round2(q.regularMarketPreviousClose ?? q.regularMarketPrice),
    name: q.longName ?? q.shortName ?? upper,
    marketCap: q.marketCap,
    source: "live",
  };
  setCached(quoteCache, upper, quote, QUOTE_TTL_MS);
  return quote;
}

export async function fetchBatchQuotes(tickers: string[]): Promise<QuoteData[]> {
  return Promise.all(tickers.map((t) => fetchStockQuote(t)));
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function fetchOptionExpirations(ticker: string): Promise<string[]> {
  const upper = ticker.toUpperCase();
  const cached = getCached(expirationsCache, upper);
  if (cached) return cached;
  return dedup(`exp:${upper}`, () => fetchOptionExpirationsUncached(upper));
}

async function fetchOptionExpirationsUncached(upper: string): Promise<string[]> {
  const result = await yf.options(upper, {});
  const expirations = (result.expirationDates ?? []).map(toDateString);
  if (expirations.length === 0) {
    throw new Error(`No option expirations for ${upper}`);
  }
  setCached(expirationsCache, upper, expirations, EXPIRATIONS_TTL_MS);
  return expirations;
}

interface YahooContract {
  strike?: number;
  lastPrice?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
  inTheMoney?: boolean;
}

function mapContract(
  c: YahooContract,
  spot: number,
  T: number,
  type: "call" | "put"
): OptionContractData | null {
  if (c.strike == null) return null;
  const iv = c.impliedVolatility ?? 0;
  let greeks: { delta?: number; gamma?: number; theta?: number; vega?: number } = {};
  if (iv > 0 && spot > 0 && T > 0) {
    const bs = blackScholes({ S: spot, K: c.strike, T, r: 0.045, sigma: iv, type });
    greeks = {
      delta: Math.round(bs.delta * 1000) / 1000,
      gamma: Math.round(bs.gamma * 10000) / 10000,
      theta: Math.round(bs.theta * 1000) / 1000,
      vega: Math.round(bs.vega * 1000) / 1000,
    };
  }
  return {
    strike: c.strike,
    lastPrice: round2(c.lastPrice ?? 0),
    bid: round2(c.bid ?? 0),
    ask: round2(c.ask ?? 0),
    volume: c.volume ?? 0,
    openInterest: c.openInterest ?? 0,
    impliedVolatility: Math.round(iv * 10000) / 100,
    inTheMoney: c.inTheMoney ?? (type === "call" ? c.strike < spot : c.strike > spot),
    ...greeks,
  };
}

export async function fetchOptionsChain(
  ticker: string,
  expiration: string
): Promise<OptionsChainData> {
  const upper = ticker.toUpperCase();
  const key = `${upper}:${expiration}`;
  const cached = getCached(chainCache, key);
  if (cached) return cached;
  return dedup(`chain:${key}`, () => fetchOptionsChainUncached(upper, expiration, key));
}

async function fetchOptionsChainUncached(
  upper: string,
  expiration: string,
  key: string
): Promise<OptionsChainData> {
  const date = new Date(`${expiration}T00:00:00Z`);
  const result = await yf.options(upper, { date });
  const optionSet = result.options?.[0];
  if (!optionSet) {
    throw new Error(`No options chain for ${upper} ${expiration}`);
  }

  const spot = result.quote?.regularMarketPrice ?? (await fetchStockQuote(upper)).price;
  const T = Math.max((date.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000), 0.001);

  const calls = (optionSet.calls ?? [])
    .map((c) => mapContract(c as YahooContract, spot, T, "call"))
    .filter((c): c is OptionContractData => c !== null);
  const puts = (optionSet.puts ?? [])
    .map((c) => mapContract(c as YahooContract, spot, T, "put"))
    .filter((c): c is OptionContractData => c !== null);

  const chain: OptionsChainData = { calls, puts, spotPrice: round2(spot), source: "live" };
  setCached(chainCache, key, chain, CHAIN_TTL_MS);
  return chain;
}

function collectFlow(
  ticker: string,
  expiration: string,
  contracts: OptionContractData[],
  type: "CALL" | "PUT",
  out: FlowEntry[]
): void {
  for (const contract of contracts) {
    if (contract.volume > 100 && contract.openInterest > 0) {
      out.push({
        ticker,
        expiration,
        strike: contract.strike,
        type,
        bid: contract.bid,
        ask: contract.ask,
        last: contract.lastPrice,
        volume: contract.volume,
        openInterest: contract.openInterest,
        volOiRatio: Math.round((contract.volume / contract.openInterest) * 100) / 100,
        iv: contract.impliedVolatility,
        inTheMoney: contract.inTheMoney,
      });
    }
  }
}

export async function fetchOptionsFlow(ticker: string): Promise<FlowEntry[]> {
  const upper = ticker.toUpperCase();
  const expirations = await fetchOptionExpirations(upper);
  const flowData: FlowEntry[] = [];

  const chains = await Promise.all(
    expirations.slice(0, 4).map(async (exp) => ({ exp, chain: await fetchOptionsChain(upper, exp) }))
  );
  for (const { exp, chain } of chains) {
    collectFlow(upper, exp, chain.calls, "CALL", flowData);
    collectFlow(upper, exp, chain.puts, "PUT", flowData);
  }

  flowData.sort((a, b) => b.volume - a.volume);
  return flowData.slice(0, 50);
}

export async function fetchPutCallRatio(ticker: string): Promise<PutCallRatio> {
  const upper = ticker.toUpperCase();
  const expirations = await fetchOptionExpirations(upper);
  let totalCallVol = 0;
  let totalPutVol = 0;
  let totalCallOI = 0;
  let totalPutOI = 0;

  const chains = await Promise.all(
    expirations.slice(0, 3).map((exp) => fetchOptionsChain(upper, exp))
  );
  for (const chain of chains) {
    for (const c of chain.calls) {
      totalCallVol += c.volume;
      totalCallOI += c.openInterest;
    }
    for (const p of chain.puts) {
      totalPutVol += p.volume;
      totalPutOI += p.openInterest;
    }
  }

  return {
    volRatio: totalCallVol > 0 ? Math.round((totalPutVol / totalCallVol) * 1000) / 1000 : 0,
    oiRatio: totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 1000) / 1000 : 0,
    totalCallVol,
    totalPutVol,
    totalCallOI,
    totalPutOI,
  };
}
