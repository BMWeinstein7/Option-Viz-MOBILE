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
  marketCap?: number;
}

export interface OptionContractData {
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
  volRatio: number;
  oiRatio: number;
  totalCallVol: number;
  totalPutVol: number;
  totalCallOI: number;
  totalPutOI: number;
}

const KNOWN_COMPANIES: Record<string, { name: string; basePrice: number; marketCap: number }> = {
  SPY: { name: "SPDR S&P 500 ETF", basePrice: 575, marketCap: 560e9 },
  QQQ: { name: "Invesco QQQ Trust", basePrice: 495, marketCap: 260e9 },
  AAPL: { name: "Apple Inc.", basePrice: 228, marketCap: 3.5e12 },
  MSFT: { name: "Microsoft Corp.", basePrice: 448, marketCap: 3.3e12 },
  GOOGL: { name: "Alphabet Inc.", basePrice: 182, marketCap: 2.2e12 },
  AMZN: { name: "Amazon.com Inc.", basePrice: 215, marketCap: 2.2e12 },
  NVDA: { name: "NVIDIA Corp.", basePrice: 138, marketCap: 3.4e12 },
  META: { name: "Meta Platforms Inc.", basePrice: 625, marketCap: 1.6e12 },
  TSLA: { name: "Tesla Inc.", basePrice: 352, marketCap: 1.1e12 },
  AMD: { name: "Advanced Micro Devices", basePrice: 118, marketCap: 190e9 },
  NFLX: { name: "Netflix Inc.", basePrice: 945, marketCap: 415e9 },
  IWM: { name: "iShares Russell 2000 ETF", basePrice: 225, marketCap: 72e9 },
  DIS: { name: "The Walt Disney Co.", basePrice: 112, marketCap: 205e9 },
  JPM: { name: "JPMorgan Chase & Co.", basePrice: 258, marketCap: 750e9 },
  BAC: { name: "Bank of America Corp.", basePrice: 47, marketCap: 360e9 },
  V: { name: "Visa Inc.", basePrice: 315, marketCap: 580e9 },
  MA: { name: "Mastercard Inc.", basePrice: 530, marketCap: 490e9 },
  JNJ: { name: "Johnson & Johnson", basePrice: 162, marketCap: 390e9 },
  WMT: { name: "Walmart Inc.", basePrice: 95, marketCap: 640e9 },
  COST: { name: "Costco Wholesale Corp.", basePrice: 915, marketCap: 410e9 },
  SOFI: { name: "SoFi Technologies Inc.", basePrice: 14, marketCap: 16e9 },
  PLTR: { name: "Palantir Technologies", basePrice: 85, marketCap: 195e9 },
  INTC: { name: "Intel Corp.", basePrice: 22, marketCap: 95e9 },
  NIO: { name: "NIO Inc.", basePrice: 4.5, marketCap: 9e9 },
  F: { name: "Ford Motor Co.", basePrice: 11, marketCap: 44e9 },
  XLE: { name: "Energy Select Sector SPDR", basePrice: 88, marketCap: 38e9 },
  GLD: { name: "SPDR Gold Shares", basePrice: 245, marketCap: 75e9 },
  SLV: { name: "iShares Silver Trust", basePrice: 28, marketCap: 14e9 },
  COIN: { name: "Coinbase Global Inc.", basePrice: 265, marketCap: 65e9 },
  BABA: { name: "Alibaba Group", basePrice: 95, marketCap: 240e9 },
  PYPL: { name: "PayPal Holdings Inc.", basePrice: 82, marketCap: 88e9 },
  UBER: { name: "Uber Technologies Inc.", basePrice: 78, marketCap: 162e9 },
  GS: { name: "Goldman Sachs Group", basePrice: 610, marketCap: 195e9 },
  WFC: { name: "Wells Fargo & Co.", basePrice: 72, marketCap: 245e9 },
  C: { name: "Citigroup Inc.", basePrice: 72, marketCap: 138e9 },
  CRM: { name: "Salesforce Inc.", basePrice: 338, marketCap: 330e9 },
  ORCL: { name: "Oracle Corp.", basePrice: 175, marketCap: 480e9 },
  AVGO: { name: "Broadcom Inc.", basePrice: 225, marketCap: 1.05e12 },
  MU: { name: "Micron Technology", basePrice: 98, marketCap: 108e9 },
  SMCI: { name: "Super Micro Computer", basePrice: 35, marketCap: 21e9 },
  ARM: { name: "Arm Holdings plc", basePrice: 170, marketCap: 176e9 },
  SQ: { name: "Block Inc.", basePrice: 78, marketCap: 47e9 },
  SHOP: { name: "Shopify Inc.", basePrice: 108, marketCap: 140e9 },
  ROKU: { name: "Roku Inc.", basePrice: 82, marketCap: 12e9 },
  SNAP: { name: "Snap Inc.", basePrice: 11, marketCap: 18e9 },
  PINS: { name: "Pinterest Inc.", basePrice: 32, marketCap: 22e9 },
  RBLX: { name: "Roblox Corp.", basePrice: 58, marketCap: 37e9 },
  GME: { name: "GameStop Corp.", basePrice: 28, marketCap: 11.5e9 },
  AMC: { name: "AMC Entertainment", basePrice: 4.5, marketCap: 1.5e9 },
  RIVN: { name: "Rivian Automotive", basePrice: 14, marketCap: 14.5e9 },
  DKNG: { name: "DraftKings Inc.", basePrice: 42, marketCap: 22e9 },
  XOM: { name: "Exxon Mobil Corp.", basePrice: 108, marketCap: 470e9 },
  CVX: { name: "Chevron Corp.", basePrice: 152, marketCap: 280e9 },
  OXY: { name: "Occidental Petroleum", basePrice: 48, marketCap: 43e9 },
  KO: { name: "Coca-Cola Co.", basePrice: 62, marketCap: 268e9 },
  PEP: { name: "PepsiCo Inc.", basePrice: 148, marketCap: 202e9 },
  MCD: { name: "McDonald's Corp.", basePrice: 295, marketCap: 212e9 },
  SBUX: { name: "Starbucks Corp.", basePrice: 98, marketCap: 112e9 },
  HD: { name: "Home Depot Inc.", basePrice: 385, marketCap: 385e9 },
  LOW: { name: "Lowe's Cos. Inc.", basePrice: 255, marketCap: 148e9 },
  TGT: { name: "Target Corp.", basePrice: 132, marketCap: 61e9 },
  BA: { name: "Boeing Co.", basePrice: 172, marketCap: 108e9 },
  LMT: { name: "Lockheed Martin Corp.", basePrice: 465, marketCap: 112e9 },
  RTX: { name: "RTX Corp.", basePrice: 122, marketCap: 162e9 },
  GE: { name: "GE Aerospace", basePrice: 195, marketCap: 212e9 },
  CAT: { name: "Caterpillar Inc.", basePrice: 365, marketCap: 180e9 },
  PFE: { name: "Pfizer Inc.", basePrice: 25, marketCap: 142e9 },
  MRNA: { name: "Moderna Inc.", basePrice: 38, marketCap: 15e9 },
  ABBV: { name: "AbbVie Inc.", basePrice: 188, marketCap: 332e9 },
  UNH: { name: "UnitedHealth Group", basePrice: 545, marketCap: 502e9 },
  LLY: { name: "Eli Lilly & Co.", basePrice: 815, marketCap: 775e9 },
  BMY: { name: "Bristol-Myers Squibb", basePrice: 55, marketCap: 112e9 },
  MRK: { name: "Merck & Co.", basePrice: 98, marketCap: 248e9 },
  GILD: { name: "Gilead Sciences Inc.", basePrice: 112, marketCap: 140e9 },
  EEM: { name: "iShares MSCI Emerging Markets", basePrice: 42, marketCap: 18e9 },
  TLT: { name: "iShares 20+ Year Treasury", basePrice: 88, marketCap: 52e9 },
  HYG: { name: "iShares iBoxx $ High Yield", basePrice: 78, marketCap: 15e9 },
  FXI: { name: "iShares China Large-Cap ETF", basePrice: 28, marketCap: 5e9 },
  TQQQ: { name: "ProShares UltraPro QQQ", basePrice: 78, marketCap: 25e9 },
  SQQQ: { name: "ProShares UltraPro Short QQQ", basePrice: 8, marketCap: 4e9 },
  SOXL: { name: "Direxion Semiconductor Bull 3X", basePrice: 28, marketCap: 12e9 },
  ARKK: { name: "ARK Innovation ETF", basePrice: 52, marketCap: 6e9 },
  MARA: { name: "MARA Holdings Inc.", basePrice: 22, marketCap: 7e9 },
  RIOT: { name: "Riot Platforms Inc.", basePrice: 12, marketCap: 4e9 },
  MSTR: { name: "MicroStrategy Inc.", basePrice: 325, marketCap: 72e9 },
  SNOW: { name: "Snowflake Inc.", basePrice: 168, marketCap: 56e9 },
  PENN: { name: "PENN Entertainment", basePrice: 18, marketCap: 3e9 },
  WYNN: { name: "Wynn Resorts Ltd.", basePrice: 92, marketCap: 10e9 },
  LVS: { name: "Las Vegas Sands Corp.", basePrice: 48, marketCap: 36e9 },
  DVN: { name: "Devon Energy Corp.", basePrice: 35, marketCap: 22e9 },
  HAL: { name: "Halliburton Co.", basePrice: 28, marketCap: 25e9 },
  USO: { name: "United States Oil Fund", basePrice: 72, marketCap: 2.5e9 },
  LCID: { name: "Lucid Group Inc.", basePrice: 2.5, marketCap: 7.5e9 },
  PLUG: { name: "Plug Power Inc.", basePrice: 2, marketCap: 1.5e9 },
  CHPT: { name: "ChargePoint Holdings", basePrice: 1.5, marketCap: 650e6 },
  EWZ: { name: "iShares MSCI Brazil ETF", basePrice: 28, marketCap: 4e9 },
  KWEB: { name: "KraneShares CSI China Internet", basePrice: 28, marketCap: 5.5e9 },
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function tickerHash(ticker: string): number {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ((hash << 5) - hash) + ticker.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTickerInfo(ticker: string): { name: string; basePrice: number; marketCap: number } {
  const upper = ticker.toUpperCase();
  const known = KNOWN_COMPANIES[upper];
  if (known) return known;

  const hash = tickerHash(upper);
  const basePrice = 10 + (hash % 900);
  const marketCap = (1e8 + (hash % 500) * 1e9);
  const name = `${upper} Corp.`;

  return { name, basePrice, marketCap };
}

function getMinuteVariation(ticker: string): number {
  const seed = tickerHash(ticker) + Math.floor(Date.now() / 60000);
  return (seededRandom(seed) - 0.5) * 0.004;
}

export async function fetchStockQuote(ticker: string): Promise<QuoteData> {
  const upper = ticker.toUpperCase();
  const info = getTickerInfo(upper);

  const dayHash = tickerHash(upper) + Math.floor(Date.now() / 86400000);
  const dailyRandom = seededRandom(dayHash);
  const changePercent = (dailyRandom - 0.5) * 6;
  const previousClose = info.basePrice;

  const minuteVar = getMinuteVariation(upper);
  const price = previousClose * (1 + changePercent / 100) + previousClose * minuteVar;
  const change = price - previousClose;
  const actualChangePercent = (change / previousClose) * 100;

  const highAdj = seededRandom(dayHash + 1) * 0.025;
  const lowAdj = seededRandom(dayHash + 2) * 0.025;
  const high = Math.max(price, previousClose) * (1 + highAdj);
  const low = Math.min(price, previousClose) * (1 - lowAdj);

  return {
    ticker: upper,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(actualChangePercent * 100) / 100,
    volume: Math.floor(seededRandom(dayHash + 3) * 80000000 + 500000),
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    open: Math.round(previousClose * (1 + (seededRandom(dayHash + 4) - 0.5) * 0.01) * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    name: info.name,
    marketCap: info.marketCap,
  };
}

export async function fetchBatchQuotes(tickers: string[]): Promise<QuoteData[]> {
  const quotes = await Promise.all(tickers.map(t => fetchStockQuote(t)));
  return quotes;
}

export async function fetchOptionExpirations(ticker: string): Promise<string[]> {
  const now = new Date();
  const expirations: string[] = [];

  const upcoming = [7, 14, 21, 28, 35, 42, 56, 70, 90, 120, 150, 180, 270, 365];
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
  const seed = tickerHash(ticker);

  const now = new Date();
  const expDate = new Date(expiration);
  const T = Math.max((expDate.getTime() - now.getTime()) / (365 * 24 * 60 * 60 * 1000), 0.001);

  const strikes = generateStrikes(spot);
  const { blackScholes } = await import("./blackScholes.js");

  const calls: OptionContractData[] = strikes.map((strike, i) => {
    const iv = 0.20 + seededRandom(seed + i) * 0.35;
    const bs = blackScholes({ S: spot, K: strike, T, r: 0.045, sigma: iv, type: "call" });
    const mid = Math.max(bs.price, 0.01);
    const spread = mid * 0.03 + 0.01;
    const isITM = strike < spot;
    return {
      strike,
      lastPrice: Math.round(mid * 100) / 100,
      bid: Math.round(Math.max(mid - spread, 0.01) * 100) / 100,
      ask: Math.round((mid + spread) * 100) / 100,
      volume: Math.floor(seededRandom(seed + i + 100) * 8000),
      openInterest: Math.floor(seededRandom(seed + i + 200) * 15000),
      impliedVolatility: Math.round(iv * 10000) / 100,
      inTheMoney: isITM,
      delta: Math.round(bs.delta * 1000) / 1000,
      gamma: Math.round(bs.gamma * 10000) / 10000,
      theta: Math.round(bs.theta * 1000) / 1000,
      vega: Math.round(bs.vega * 1000) / 1000,
    };
  });

  const puts: OptionContractData[] = strikes.map((strike, i) => {
    const iv = 0.20 + seededRandom(seed + i + 50) * 0.35;
    const bs = blackScholes({ S: spot, K: strike, T, r: 0.045, sigma: iv, type: "put" });
    const mid = Math.max(bs.price, 0.01);
    const spread = mid * 0.03 + 0.01;
    const isITM = strike > spot;
    return {
      strike,
      lastPrice: Math.round(mid * 100) / 100,
      bid: Math.round(Math.max(mid - spread, 0.01) * 100) / 100,
      ask: Math.round((mid + spread) * 100) / 100,
      volume: Math.floor(seededRandom(seed + i + 150) * 8000),
      openInterest: Math.floor(seededRandom(seed + i + 250) * 15000),
      impliedVolatility: Math.round(iv * 10000) / 100,
      inTheMoney: isITM,
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
  const step = spotPrice < 10 ? 0.5 : spotPrice < 50 ? 1 : spotPrice < 200 ? 5 : spotPrice < 500 ? 10 : 25;
  const atm = Math.round(spotPrice / step) * step;

  for (let i = -12; i <= 12; i++) {
    strikes.push(atm + i * step);
  }

  return strikes.filter((s) => s > 0);
}

export async function fetchOptionsFlow(ticker: string): Promise<FlowEntry[]> {
  const expirations = await fetchOptionExpirations(ticker);
  const flowData: FlowEntry[] = [];
  const expsToCheck = expirations.slice(0, 4);

  for (const exp of expsToCheck) {
    const chain = await fetchOptionsChain(ticker, exp);

    for (const contract of chain.calls) {
      if (contract.volume > 100 && contract.openInterest > 0) {
        flowData.push({
          ticker: ticker.toUpperCase(),
          expiration: exp,
          strike: contract.strike,
          type: "CALL",
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

    for (const contract of chain.puts) {
      if (contract.volume > 100 && contract.openInterest > 0) {
        flowData.push({
          ticker: ticker.toUpperCase(),
          expiration: exp,
          strike: contract.strike,
          type: "PUT",
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

  flowData.sort((a, b) => b.volume - a.volume);
  return flowData.slice(0, 50);
}

export async function fetchPutCallRatio(ticker: string): Promise<PutCallRatio> {
  const expirations = await fetchOptionExpirations(ticker);
  let totalCallVol = 0;
  let totalPutVol = 0;
  let totalCallOI = 0;
  let totalPutOI = 0;

  const expsToCheck = expirations.slice(0, 3);

  for (const exp of expsToCheck) {
    const chain = await fetchOptionsChain(ticker, exp);
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

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "N/A";
  const abs = Math.abs(num);
  if (abs >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return String(Math.round(num));
}
