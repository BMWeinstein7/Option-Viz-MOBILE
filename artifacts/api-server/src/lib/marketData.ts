export interface QuoteData {
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
}

export interface OptionContractData {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

const COMPANY_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  NVDA: "NVIDIA Corporation",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  AMD: "Advanced Micro Devices",
  NFLX: "Netflix Inc.",
  SPY: "SPDR S&P 500 ETF",
  QQQ: "Invesco QQQ ETF",
  IWM: "iShares Russell 2000 ETF",
  DIS: "The Walt Disney Company",
  JPM: "JPMorgan Chase & Co.",
  BAC: "Bank of America Corp.",
  V: "Visa Inc.",
  MA: "Mastercard Inc.",
  JNJ: "Johnson & Johnson",
  WMT: "Walmart Inc.",
  COST: "Costco Wholesale Corp.",
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export async function fetchStockQuote(ticker: string): Promise<QuoteData> {
  const upper = ticker.toUpperCase();

  const basePrice = getBasePrice(upper);
  const seed = upper.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const dailyRandom = seededRandom(seed + Math.floor(Date.now() / 86400000));

  const changePercent = (dailyRandom - 0.5) * 4;
  const previousClose = basePrice * (1 - changePercent / 200);
  const price = basePrice + (seededRandom(seed + Date.now() / 60000) - 0.5) * basePrice * 0.002;
  const change = price - previousClose;
  const high = price * (1 + seededRandom(seed + 1) * 0.02);
  const low = price * (1 - seededRandom(seed + 2) * 0.02);

  return {
    ticker: upper,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: Math.floor(seededRandom(seed + 3) * 50000000 + 1000000),
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    open: Math.round(previousClose * (1 + (seededRandom(seed + 4) - 0.5) * 0.01) * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    name: COMPANY_NAMES[upper] || `${upper} Corp.`,
  };
}

function getBasePrice(ticker: string): number {
  const prices: Record<string, number> = {
    AAPL: 182, MSFT: 415, GOOGL: 172, AMZN: 195, NVDA: 875,
    META: 510, TSLA: 248, AMD: 168, NFLX: 628, SPY: 550,
    QQQ: 470, IWM: 215, DIS: 115, JPM: 225, BAC: 44,
    V: 295, MA: 485, JNJ: 158, WMT: 91, COST: 880,
  };
  return prices[ticker] || 100 + Math.abs(ticker.charCodeAt(0) * 3.7) % 400;
}

export async function fetchOptionExpirations(ticker: string): Promise<string[]> {
  const now = new Date();
  const expirations: string[] = [];

  const upcoming = [7, 14, 21, 28, 45, 60, 90, 120, 180, 270, 365];
  for (const days of upcoming) {
    const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const friday = getNextFriday(date);
    const str = friday.toISOString().split("T")[0];
    if (!expirations.includes(str)) {
      expirations.push(str);
    }
  }

  return expirations.sort();
}

function getNextFriday(date: Date): Date {
  const day = date.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(date);
  friday.setDate(date.getDate() + daysUntilFriday);
  return friday;
}

export async function fetchOptionsChain(
  ticker: string,
  expiration: string
): Promise<{ calls: OptionContractData[]; puts: OptionContractData[]; spotPrice: number }> {
  const quote = await fetchStockQuote(ticker);
  const spot = quote.price;
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const now = new Date();
  const expDate = new Date(expiration);
  const T = Math.max((expDate.getTime() - now.getTime()) / (365 * 24 * 60 * 60 * 1000), 0.001);

  const strikes = generateStrikes(spot);
  const { blackScholes } = await import("./blackScholes.js");

  const calls: OptionContractData[] = strikes.map((strike, i) => {
    const iv = 0.25 + seededRandom(seed + i) * 0.3;
    const bs = blackScholes({ S: spot, K: strike, T, r: 0.045, sigma: iv, type: "call" });
    const mid = Math.max(bs.price, 0.01);
    const spread = mid * 0.04;
    return {
      strike,
      lastPrice: Math.round(mid * 100) / 100,
      bid: Math.round((mid - spread) * 100) / 100,
      ask: Math.round((mid + spread) * 100) / 100,
      volume: Math.floor(seededRandom(seed + i + 100) * 5000),
      openInterest: Math.floor(seededRandom(seed + i + 200) * 10000),
      impliedVolatility: Math.round(iv * 10000) / 100,
      delta: Math.round(bs.delta * 1000) / 1000,
      gamma: Math.round(bs.gamma * 10000) / 10000,
      theta: Math.round(bs.theta * 1000) / 1000,
      vega: Math.round(bs.vega * 1000) / 1000,
    };
  });

  const puts: OptionContractData[] = strikes.map((strike, i) => {
    const iv = 0.25 + seededRandom(seed + i + 50) * 0.3;
    const bs = blackScholes({ S: spot, K: strike, T, r: 0.045, sigma: iv, type: "put" });
    const mid = Math.max(bs.price, 0.01);
    const spread = mid * 0.04;
    return {
      strike,
      lastPrice: Math.round(mid * 100) / 100,
      bid: Math.round((mid - spread) * 100) / 100,
      ask: Math.round((mid + spread) * 100) / 100,
      volume: Math.floor(seededRandom(seed + i + 150) * 5000),
      openInterest: Math.floor(seededRandom(seed + i + 250) * 10000),
      impliedVolatility: Math.round(iv * 10000) / 100,
      delta: Math.round(bs.delta * 1000) / 1000,
      gamma: Math.round(bs.gamma * 10000) / 10000,
      theta: Math.round(bs.theta * 1000) / 1000,
      vega: Math.round(bs.vega * 1000) / 1000,
    };
  });

  return { calls, puts, spotPrice: spot };
}

function generateStrikes(spotPrice: number): number[] {
  const strikes: number[] = [];
  const step = spotPrice < 50 ? 1 : spotPrice < 200 ? 5 : spotPrice < 500 ? 10 : 25;
  const atm = Math.round(spotPrice / step) * step;

  for (let i = -10; i <= 10; i++) {
    strikes.push(atm + i * step);
  }

  return strikes.filter((s) => s > 0);
}
