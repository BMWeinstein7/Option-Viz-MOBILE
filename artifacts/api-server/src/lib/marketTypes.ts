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
  /** Where the data came from: a real market data provider or the simulated engine. */
  source?: "live" | "simulated";
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

export interface OptionsChainData {
  calls: OptionContractData[];
  puts: OptionContractData[];
  spotPrice: number;
  source?: "live" | "simulated";
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

export interface OptionsFlowData {
  flow: FlowEntry[];
  source: "live" | "simulated";
}

export interface PutCallRatio {
  /** Where the data came from: a real market data provider or the simulated engine. */
  source?: "live" | "simulated";
  volRatio: number;
  oiRatio: number;
  totalCallVol: number;
  totalPutVol: number;
  totalCallOI: number;
  totalPutOI: number;
}

export interface StrikeSummaryData {
  strike: number;
  callOpenInterest: number;
  putOpenInterest: number;
  callVolume: number;
  putVolume: number;
  callIV: number;
  putIV: number;
  callBid: number;
  callAsk: number;
  putBid: number;
  putAsk: number;
}

export interface ChainSummaryData {
  ticker: string;
  expiration: string;
  spotPrice: number;
  source: "live" | "simulated";
  /** Strike where aggregate payout to option holders at expiry is smallest. */
  maxPain: number | null;
  totalCallOpenInterest: number;
  totalPutOpenInterest: number;
  totalCallVolume: number;
  totalPutVolume: number;
  strikes: StrikeSummaryData[];
}

export interface PricePointData {
  date: string;
  close: number;
  volume: number;
}

export interface PriceHistoryData {
  ticker: string;
  range: string;
  points: PricePointData[];
}
