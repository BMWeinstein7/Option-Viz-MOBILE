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
  legs: StrategyLeg[];
}

router.post("/strategy/analyze", (req, res) => {
  try {
    const body = req.body as AnalyzeRequest;
    const { spotPrice, legs, riskFreeRate = 0.045 } = body;

    if (!legs || legs.length === 0) {
      res.status(400).json({ error: "BAD_REQUEST", message: "At least one leg required" });
      return;
    }

    // Net cost (positive = debit, negative = credit)
    let netCost = 0;
    for (const leg of legs) {
      const multiplier = leg.action === "buy" ? 1 : -1;
      netCost += multiplier * leg.premium * leg.quantity * 100;
    }

    // Generate P&L at expiry across a range of stock prices
    const range = spotPrice * 0.5;
    const steps = 100;
    const prices: number[] = [];
    for (let i = 0; i <= steps; i++) {
      prices.push(spotPrice - range + (i * 2 * range) / steps);
    }

    const pnlAtExpiry = prices.map((price) => {
      let pnl = -netCost;
      for (const leg of legs) {
        const multiplier = leg.action === "buy" ? 1 : -1;
        const intrinsic =
          leg.type === "call"
            ? Math.max(price - leg.strike, 0)
            : Math.max(leg.strike - price, 0);
        pnl += multiplier * intrinsic * leg.quantity * 100;
      }
      return { price: Math.round(price * 100) / 100, pnl: Math.round(pnl * 100) / 100 };
    });

    // Max profit and loss
    const pnlValues = pnlAtExpiry.map((p) => p.pnl);
    const maxProfit = Math.max(...pnlValues);
    const maxLoss = Math.min(...pnlValues);

    // Break-even points
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

    // Aggregate Greeks using Black-Scholes
    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let totalRho = 0;

    for (const leg of legs) {
      const days = daysToExpiry(leg.expiration);
      const T = days / 365;
      const sigma = 0.25; // default IV for Greeks calculation

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
