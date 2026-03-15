function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * y);
}

function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BSInputs {
  S: number; // spot price
  K: number; // strike price
  T: number; // time to expiry in years
  r: number; // risk-free rate
  sigma: number; // implied volatility
  type: "call" | "put";
}

export interface BSResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function blackScholes(inputs: BSInputs): BSResult {
  const { S, K, T, r, sigma, type } = inputs;

  if (T <= 0) {
    const intrinsic = type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return { price: intrinsic, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  let price: number;
  let delta: number;
  let rho: number;

  if (type === "call") {
    price = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    delta = normalCDF(d1);
    rho = K * T * Math.exp(-r * T) * normalCDF(d2) / 100;
  } else {
    price = K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    delta = normalCDF(d1) - 1;
    rho = -K * T * Math.exp(-r * T) * normalCDF(-d2) / 100;
  }

  const gamma = normalPDF(d1) / (S * sigma * sqrtT);
  const theta =
    (-S * normalPDF(d1) * sigma / (2 * sqrtT) -
      r * K * Math.exp(-r * T) * (type === "call" ? normalCDF(d2) : -normalCDF(-d2))) /
    365;
  const vega = S * normalPDF(d1) * sqrtT / 100;

  return { price, delta, gamma, theta, vega, rho };
}

export function daysToExpiry(expiration: string): number {
  const expDate = new Date(expiration);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  return Math.max(diffMs / (1000 * 60 * 60 * 24), 0);
}
