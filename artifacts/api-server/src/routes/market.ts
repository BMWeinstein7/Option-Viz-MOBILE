import { Router, type IRouter } from "express";
import {
  fetchStockQuote,
  fetchOptionExpirations,
  fetchOptionsChain,
} from "../lib/marketData.js";

const router: IRouter = Router();

router.get("/market/quote/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;
    const quote = await fetchStockQuote(ticker);
    res.json(quote);
  } catch (error) {
    res.status(404).json({ error: "NOT_FOUND", message: `Ticker ${req.params.ticker} not found` });
  }
});

router.get("/market/expirations/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;
    const expirations = await fetchOptionExpirations(ticker);
    res.json({ ticker: ticker.toUpperCase(), expirations });
  } catch (error) {
    res.status(404).json({ error: "NOT_FOUND", message: "Could not fetch expirations" });
  }
});

router.get("/market/chain/:ticker/:expiration", async (req, res) => {
  try {
    const { ticker, expiration } = req.params;
    const chain = await fetchOptionsChain(ticker, expiration);
    res.json({
      ticker: ticker.toUpperCase(),
      expiration,
      spotPrice: chain.spotPrice,
      calls: chain.calls,
      puts: chain.puts,
    });
  } catch (error) {
    res.status(404).json({ error: "NOT_FOUND", message: "Could not fetch options chain" });
  }
});

export default router;
