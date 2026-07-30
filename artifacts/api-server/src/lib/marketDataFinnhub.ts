import type { QuoteData } from "./marketTypes.js";

/**
 * Secondary live provider: Finnhub (https://finnhub.io).
 *
 * Configured via the FINNHUB_API_KEY secret. Free-tier Finnhub covers real-time
 * stock quotes but not options chains, so this provider only implements
 * quotes; options-related operations are not supported here and the router
 * falls through to the simulated engine (explicitly logged) for those.
 */

const API_BASE = "https://finnhub.io/api/v1";

export function isConfigured(): boolean {
  return Boolean(process.env.FINNHUB_API_KEY);
}

// Short-lived cache + in-flight dedup, mirroring the Yahoo provider, so the
// 3s SSE poll doesn't burn through Finnhub's free-tier rate limit (60/min).
const QUOTE_TTL_MS = 3_000;

interface CacheEntry {
  value: QuoteData;
  expiresAt: number;
}

const quoteCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<QuoteData>>();

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function fetchStockQuote(ticker: string): Promise<QuoteData> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("Finnhub provider not configured (FINNHUB_API_KEY missing)");
  }
  const upper = ticker.toUpperCase();

  const cached = quoteCache.get(upper);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const existing = inFlight.get(upper);
  if (existing) return existing;

  const p = fetchStockQuoteUncached(upper, apiKey).finally(() => inFlight.delete(upper));
  inFlight.set(upper, p);
  return p;
}

interface FinnhubQuote {
  c?: number; // current price
  d?: number; // change
  dp?: number; // percent change
  h?: number; // high
  l?: number; // low
  o?: number; // open
  pc?: number; // previous close
}

async function fetchStockQuoteUncached(upper: string, apiKey: string): Promise<QuoteData> {
  const url = `${API_BASE}/quote?symbol=${encodeURIComponent(upper)}&token=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub quote request failed for ${upper}: HTTP ${res.status}`);
  }
  const q = (await res.json()) as FinnhubQuote;
  // Finnhub returns c=0 for unknown symbols rather than an error.
  if (!q || typeof q.c !== "number" || q.c === 0) {
    throw new Error(`No Finnhub quote for ${upper}`);
  }

  const price = q.c;
  const quote: QuoteData = {
    ticker: upper,
    price: round2(price),
    change: round2(q.d ?? 0),
    changePercent: round2(q.dp ?? 0),
    // Finnhub's quote endpoint doesn't include volume or market cap.
    volume: 0,
    high: round2(q.h ?? price),
    low: round2(q.l ?? price),
    open: round2(q.o ?? price),
    previousClose: round2(q.pc ?? price),
    name: upper,
    source: "live",
  };
  quoteCache.set(upper, { value: quote, expiresAt: Date.now() + QUOTE_TTL_MS });
  if (quoteCache.size > 500) {
    const oldest = quoteCache.keys().next().value;
    if (oldest !== undefined) quoteCache.delete(oldest);
  }
  return quote;
}
