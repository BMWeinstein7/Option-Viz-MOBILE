import type {
  QuoteData,
  OptionContractData,
  OptionsChainData,
  FlowEntry,
  OptionsFlowData,
  PutCallRatio,
} from "./marketTypes.js";
import * as live from "./marketDataLive.js";
import * as finnhub from "./marketDataFinnhub.js";
import * as simulated from "./marketDataSimulated.js";

export type {
  QuoteData,
  OptionContractData,
  OptionsChainData,
  FlowEntry,
  OptionsFlowData,
  PutCallRatio,
} from "./marketTypes.js";

/**
 * Market data router.
 *
 * Provider order:
 *   1. Yahoo Finance (yahoo-finance2, no key) — quotes, expirations, chains.
 *   2. Finnhub (FINNHUB_API_KEY secret, optional) — quotes only; tried when
 *      Yahoo fails (rate limits, endpoint changes) before any simulated data.
 *   3. Simulated engine — last resort, or forced via MARKET_DATA_PROVIDER=simulated.
 * Every fallback hop is logged so simulated data is never served silently.
 */

const FORCE_SIMULATED = process.env.MARKET_DATA_PROVIDER === "simulated";

if (FORCE_SIMULATED) {
  console.warn("[marketData] MARKET_DATA_PROVIDER=simulated — serving simulated market data only");
} else {
  const secondary = finnhub.isConfigured()
    ? "Finnhub (quotes) as secondary live provider"
    : "no secondary live provider (set FINNHUB_API_KEY to enable Finnhub)";
  console.log(
    `[marketData] Provider order: Yahoo Finance (primary), ${secondary}, simulated engine as last-resort fallback`
  );
}

const lastWarnAt = new Map<string, number>();
const WARN_INTERVAL_MS = 60_000;

function warnFallback(op: string, ticker: string, from: string, to: string, error: unknown): void {
  const key = `${op}:${ticker}:${to}`;
  const now = Date.now();
  const last = lastWarnAt.get(key) ?? 0;
  if (now - last > WARN_INTERVAL_MS) {
    lastWarnAt.set(key, now);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[marketData] ${from} ${op} failed for ${ticker}, falling back to ${to}: ${message}`);
  }
}

async function withFallback<T>(
  op: string,
  ticker: string,
  liveFn: () => Promise<T>,
  simulatedFn: () => Promise<T>,
  secondaryFn?: () => Promise<T>
): Promise<T> {
  if (FORCE_SIMULATED) return simulatedFn();
  try {
    return await liveFn();
  } catch (primaryError) {
    if (secondaryFn && finnhub.isConfigured()) {
      warnFallback(op, ticker, "Yahoo", "Finnhub", primaryError);
      try {
        return await secondaryFn();
      } catch (secondaryError) {
        warnFallback(op, ticker, "Finnhub", "simulated data", secondaryError);
        return simulatedFn();
      }
    }
    warnFallback(op, ticker, "Yahoo", "simulated data", primaryError);
    return simulatedFn();
  }
}

export async function fetchStockQuote(ticker: string): Promise<QuoteData> {
  return withFallback(
    "quote",
    ticker,
    () => live.fetchStockQuote(ticker),
    () => simulated.fetchStockQuote(ticker),
    () => finnhub.fetchStockQuote(ticker)
  );
}

export async function fetchBatchQuotes(tickers: string[]): Promise<QuoteData[]> {
  return Promise.all(tickers.map((t) => fetchStockQuote(t)));
}

export async function fetchOptionExpirations(ticker: string): Promise<string[]> {
  return withFallback(
    "expirations",
    ticker,
    () => live.fetchOptionExpirations(ticker),
    () => simulated.fetchOptionExpirations(ticker)
  );
}

export async function fetchOptionsChain(
  ticker: string,
  expiration: string
): Promise<OptionsChainData> {
  return withFallback(
    "chain",
    ticker,
    () => live.fetchOptionsChain(ticker, expiration),
    () => simulated.fetchOptionsChain(ticker, expiration)
  );
}

export async function fetchOptionsFlow(ticker: string): Promise<OptionsFlowData> {
  return withFallback<OptionsFlowData>(
    "flow",
    ticker,
    async () => ({ flow: await live.fetchOptionsFlow(ticker), source: "live" }),
    async () => ({ flow: await simulated.fetchOptionsFlow(ticker), source: "simulated" })
  );
}

export async function fetchPutCallRatio(ticker: string): Promise<PutCallRatio> {
  return withFallback<PutCallRatio>(
    "pcr",
    ticker,
    async () => ({ ...(await live.fetchPutCallRatio(ticker)), source: "live" }),
    async () => ({ ...(await simulated.fetchPutCallRatio(ticker)), source: "simulated" })
  );
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "N/A";
  const abs = Math.abs(num);
  if (abs >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return String(Math.round(num));
}
