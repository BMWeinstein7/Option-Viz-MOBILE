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

export interface PutCallRatio {
  volRatio: number;
  oiRatio: number;
  totalCallVol: number;
  totalPutVol: number;
  totalCallOI: number;
  totalPutOI: number;
}
