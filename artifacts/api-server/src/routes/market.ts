import { Router, type IRouter, type Request, type Response } from "express";
import {
  fetchStockQuote,
  fetchBatchQuotes,
  fetchOptionExpirations,
  fetchOptionsChain,
  fetchOptionsFlow,
  fetchPutCallRatio,
} from "../lib/marketData.js";

const router: IRouter = Router();

const TICKER_RE = /^[A-Za-z.]{1,10}$/;

function sanitizeTicker(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  return TICKER_RE.test(trimmed) ? trimmed : null;
}

router.get("/market/quote/:ticker", async (req, res) => {
  try {
    const ticker = sanitizeTicker(req.params.ticker);
    if (!ticker) { res.status(400).json({ error: "BAD_REQUEST", message: "Invalid ticker format" }); return; }
    const quote = await fetchStockQuote(ticker);
    res.json(quote);
  } catch (error) {
    res.status(404).json({ error: "NOT_FOUND", message: `Ticker ${req.params.ticker} not found` });
  }
});

router.post("/market/batch-quotes", async (req, res) => {
  try {
    const { tickers } = req.body as { tickers: string[] };
    if (!tickers || !Array.isArray(tickers)) {
      res.status(400).json({ error: "BAD_REQUEST", message: "tickers array required" });
      return;
    }
    const clean = tickers
      .slice(0, 100)
      .filter((t): t is string => typeof t === "string" && TICKER_RE.test(t.trim()))
      .map((t) => t.trim().toUpperCase());
    const quotes = await fetchBatchQuotes(clean);
    res.json({ quotes });
  } catch (error) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch batch quotes" });
  }
});

router.get("/market/expirations/:ticker", async (req, res) => {
  try {
    const ticker = sanitizeTicker(req.params.ticker);
    if (!ticker) { res.status(400).json({ error: "BAD_REQUEST", message: "Invalid ticker format" }); return; }
    const expirations = await fetchOptionExpirations(ticker);
    res.json({ ticker, expirations });
  } catch (error) {
    res.status(404).json({ error: "NOT_FOUND", message: "Could not fetch expirations" });
  }
});

router.get("/market/chain/:ticker/:expiration", async (req, res) => {
  try {
    const ticker = sanitizeTicker(req.params.ticker);
    if (!ticker) { res.status(400).json({ error: "BAD_REQUEST", message: "Invalid ticker format" }); return; }
    const expiration = req.params.expiration;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiration) || isNaN(Date.parse(expiration))) {
      res.status(400).json({ error: "BAD_REQUEST", message: "Invalid expiration date format (YYYY-MM-DD)" }); return;
    }
    const chain = await fetchOptionsChain(ticker, expiration);
    res.json({
      ticker,
      expiration,
      spotPrice: chain.spotPrice,
      calls: chain.calls,
      puts: chain.puts,
    });
  } catch (error) {
    res.status(404).json({ error: "NOT_FOUND", message: "Could not fetch options chain" });
  }
});

router.get("/market/flow/:ticker", async (req, res) => {
  try {
    const ticker = sanitizeTicker(req.params.ticker);
    if (!ticker) { res.status(400).json({ error: "BAD_REQUEST", message: "Invalid ticker format" }); return; }
    const flow = await fetchOptionsFlow(ticker);
    res.json({ ticker, flow });
  } catch (error) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Could not fetch options flow" });
  }
});

router.get("/market/pcr/:ticker", async (req, res) => {
  try {
    const ticker = sanitizeTicker(req.params.ticker);
    if (!ticker) { res.status(400).json({ error: "BAD_REQUEST", message: "Invalid ticker format" }); return; }
    const pcr = await fetchPutCallRatio(ticker);
    res.json({ ticker, ...pcr });
  } catch (error) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Could not fetch put/call ratio" });
  }
});

router.get("/market/stream/:ticker", (req: Request, res: Response) => {
  const ticker = sanitizeTicker(req.params.ticker);
  if (!ticker) { res.status(400).json({ error: "BAD_REQUEST", message: "Invalid ticker format" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let intervalId: NodeJS.Timeout;

  const sendQuote = async () => {
    try {
      const quote = await fetchStockQuote(ticker as string);
      res.write(`data: ${JSON.stringify(quote)}\n\n`);
    } catch {
      res.write(`data: ${JSON.stringify({ error: "fetch_failed" })}\n\n`);
    }
  };

  sendQuote();
  intervalId = setInterval(sendQuote, 3000);

  req.on("close", () => {
    clearInterval(intervalId);
  });
});

export default router;
