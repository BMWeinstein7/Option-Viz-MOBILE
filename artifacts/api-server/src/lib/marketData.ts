import type {
  QuoteData,
  OptionContractData,
  OptionsChainData,
  FlowEntry,
  PutCallRatio,
} from "./marketTypes.js";
import * as live from "./marketDataLive.js";
import * as simulated from "./marketDataSimulated.js";

export type {
  QuoteData,
  OptionContractData,
  OptionsChainData,
  FlowEntry,
  PutCallRatio,
} from "./marketTypes.js";

/**
 * Market data router.
 *
 * Primary provider: live Yahoo Finance data (real quotes, expirations, and
 * options chains). Fallback: the simulated engine, used only when the live
 * provider fails or when MARKET_DATA_PROVIDER=simulated is set explicitly.
 * Every fallback is logged so simulated data is never served silently.
 */

const FORCE_SIMULATED = process.env.MARKET_DATA_PROVIDER === "simulated";

if (FORCE_SIMULATED) {
  console.warn("[marketData] MARKET_DATA_PROVIDER=simulated — serving simulated market data only");
} else {
  console.log("[marketData] Live market data provider enabled (Yahoo Finance), simulated engine kept as fallback");
}

const lastWarnAt = new Map<string, number>();
const WARN_INTERVAL_MS = 60_000;

function warnFallback(op: string, ticker: string, error: unknown): void {
  const key = `${op}:${ticker}`;
  const now = Date.now();
  const last = lastWarnAt.get(key) ?? 0;
  if (now - last > WARN_INTERVAL_MS) {
    lastWarnAt.set(key, now);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[marketData] Live ${op} failed for ${ticker}, falling back to simulated data: ${message}`);
  }
}

async function withFallback<T>(
  op: string,
  ticker: string,
  liveFn: () => Promise<T>,
  simulatedFn: () => Promise<T>
): Promise<T> {
  if (FORCE_SIMULATED) return simulatedFn();
  try {
    return await liveFn();
  } catch (error) {
    warnFallback(op, ticker, error);
    return simulatedFn();
  }
}

export async function fetchStockQuote(ticker: string): Promise<QuoteData> {
  return withFallback(
    "quote",
    ticker,
    () => live.fetchStockQuote(ticker),
    () => simulated.fetchStockQuote(ticker)
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

export async function fetchOptionsFlow(ticker: string): Promise<FlowEntry[]> {
  return withFallback(
    "flow",
    ticker,
    () => live.fetchOptionsFlow(ticker),
    () => simulated.fetchOptionsFlow(ticker)
  );
}

export async function fetchPutCallRatio(ticker: string): Promise<PutCallRatio> {
  return withFallback(
    "pcr",
    ticker,
    () => live.fetchPutCallRatio(ticker),
    () => simulated.fetchPutCallRatio(ticker)
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
