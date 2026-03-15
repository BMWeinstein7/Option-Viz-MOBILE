import { Router, type IRouter } from "express";
import { blackScholes, daysToExpiry } from "../lib/blackScholes.js";

const router: IRouter = Router();

interface StrategyLeg {
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
  expiration: string;
}

interface AnalyzeRequest {
  ticker: string;
  spotPrice: number;
  riskFreeRate?: number;
  impliedVol?: number;
  legs: StrategyLeg[];
}

function calculateLegPnl(
  priceRange: number[],
  leg: StrategyLeg,
  r: number,
  sigma: number,
  tRemaining: number
): number[] {
  const { strike, quantity, premium, action, type } = leg;

  return priceRange.map((S) => {
    let value: number;
    if (tRemaining <= 0) {
      value = type === "call" ? Math.max(S - strike, 0) : Math.max(strike - S, 0);
    } else {
      const bs = blackScholes({ S, K: strike, T: tRemaining, r, sigma, type });
      value = bs.price;
    }

    if (action === "buy") {
      return (value - premium) * quantity * 100;
    } else {
      return (premium - value) * quantity * 100;
    }
  });
}

router.post("/strategy/analyze", (req, res) => {
  try {
    const body = req.body as AnalyzeRequest;
    const { spotPrice, legs, riskFreeRate = 0.045, impliedVol = 0.30 } = body;

    if (!legs || legs.length === 0) {
      res.status(400).json({ error: "BAD_REQUEST", message: "At least one leg required" });
      return;
    }

    const range = spotPrice * 0.4;
    const steps = 200;
    const prices: number[] = [];
    for (let i = 0; i <= steps; i++) {
      prices.push(Math.max(spotPrice - range + (i * 2 * range) / steps, 0.01));
    }

    let maxDTE = 30;
    for (const leg of legs) {
      const d = daysToExpiry(leg.expiration);
      if (d > maxDTE) maxDTE = d;
    }

    const pnlAtExpiry = prices.map((price) => {
      let totalPnl = 0;
      for (const leg of legs) {
        const pnlArr = calculateLegPnl([price], leg, riskFreeRate, impliedVol, 0);
        totalPnl += pnlArr[0];
      }
      return { price: Math.round(price * 100) / 100, pnl: Math.round(totalPnl * 100) / 100 };
    });

    const now = new Date();
    const legExpiryDates = legs.map((leg) => new Date(leg.expiration));

    const timeDecayCurves: { dte: number; label: string; data: { price: number; pnl: number }[] }[] = [];
    const fractions = [0.75, 0.5, 0.25];
    for (const frac of fractions) {
      const dteLabel = Math.round(maxDTE * frac);
      const daysForward = maxDTE * (1 - frac);
      const valuationDate = new Date(now.getTime() + daysForward * 24 * 60 * 60 * 1000);

      const curveData = prices.map((price) => {
        let totalPnl = 0;
        for (let li = 0; li < legs.length; li++) {
          const leg = legs[li];
          const legExpiry = legExpiryDates[li];
          const legTRemaining = Math.max((legExpiry.getTime() - valuationDate.getTime()) / (365 * 24 * 60 * 60 * 1000), 0);
          const pnlArr = calculateLegPnl([price], leg, riskFreeRate, impliedVol, legTRemaining);
          totalPnl += pnlArr[0];
        }
        return { price: Math.round(price * 100) / 100, pnl: Math.round(totalPnl * 100) / 100 };
      });

      timeDecayCurves.push({ dte: dteLabel, label: `${dteLabel} DTE`, data: curveData });
    }

    const pnlValues = pnlAtExpiry.map((p) => p.pnl);
    const maxProfit = Math.max(...pnlValues);
    const maxLoss = Math.min(...pnlValues);

    const breakEvenPoints: number[] = [];
    for (let i = 1; i < pnlAtExpiry.length; i++) {
      const prev = pnlAtExpiry[i - 1];
      const curr = pnlAtExpiry[i];
      if ((prev.pnl < 0 && curr.pnl >= 0) || (prev.pnl >= 0 && curr.pnl < 0)) {
        const breakEven =
          prev.price + (curr.price - prev.price) * (-prev.pnl / (curr.pnl - prev.pnl));
        breakEvenPoints.push(Math.round(breakEven * 100) / 100);
      }
    }

    let netCost = 0;
    for (const leg of legs) {
      const multiplier = leg.action === "buy" ? 1 : -1;
      netCost += multiplier * leg.premium * leg.quantity * 100;
    }

    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let totalRho = 0;

    for (const leg of legs) {
      const days = daysToExpiry(leg.expiration);
      const T = days / 365;
      const sigma = impliedVol;

      if (T > 0) {
        const bs = blackScholes({
          S: spotPrice,
          K: leg.strike,
          T,
          r: riskFreeRate,
          sigma,
          type: leg.type,
        });

        const multiplier = leg.action === "buy" ? 1 : -1;
        const qty = leg.quantity;
        totalDelta += multiplier * bs.delta * qty;
        totalGamma += multiplier * bs.gamma * qty;
        totalTheta += multiplier * bs.theta * qty;
        totalVega += multiplier * bs.vega * qty;
        totalRho += multiplier * bs.rho * qty;
      }
    }

    const riskRewardRatio =
      maxLoss < 0 && maxProfit > 0
        ? Math.round((maxProfit / Math.abs(maxLoss)) * 100) / 100
        : null;

    res.json({
      pnlAtExpiry,
      timeDecayCurves,
      greeks: {
        delta: Math.round(totalDelta * 10000) / 10000,
        gamma: Math.round(totalGamma * 10000) / 10000,
        theta: Math.round(totalTheta * 10000) / 10000,
        vega: Math.round(totalVega * 10000) / 10000,
        rho: Math.round(totalRho * 10000) / 10000,
      },
      maxProfit: maxProfit === Infinity ? null : Math.round(maxProfit * 100) / 100,
      maxLoss: maxLoss === -Infinity ? null : Math.round(maxLoss * 100) / 100,
      breakEvenPoints,
      netCost: Math.round(netCost * 100) / 100,
      riskRewardRatio,
    });
  } catch (error) {
    console.error("Strategy analysis error:", error);
    res.status(400).json({ error: "BAD_REQUEST", message: "Failed to analyze strategy" });
  }
});

export default router;
