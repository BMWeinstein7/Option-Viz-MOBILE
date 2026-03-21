import { Router } from "express";
import { db } from "@workspace/db";
import { savedStrategiesTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

const TICKER_RE = /^[A-Za-z.]{1,10}$/;

router.get("/strategies", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const strategies = await db
      .select()
      .from(savedStrategiesTable)
      .where(eq(savedStrategiesTable.userId, req.user.id))
      .orderBy(desc(savedStrategiesTable.createdAt));

    res.json(strategies.map((s) => ({
      id: s.id,
      name: s.name,
      ticker: s.ticker,
      spotPrice: parseFloat(s.spotPrice),
      legs: s.legs,
      createdAt: s.createdAt?.toISOString(),
      updatedAt: s.updatedAt?.toISOString(),
    })));
  } catch (e: any) {
    console.error("Get strategies error:", e);
    res.status(500).json({ error: "Failed to fetch strategies" });
  }
});

router.post("/strategies", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const { name, ticker, spotPrice, legs } = req.body;

    if (!name || !ticker || !spotPrice || !legs) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (typeof ticker !== "string" || !TICKER_RE.test(ticker.trim())) {
      res.status(400).json({ error: "Invalid ticker format" });
      return;
    }

    if (!Array.isArray(legs) || legs.length === 0) {
      res.status(400).json({ error: "At least one leg is required" });
      return;
    }

    const [strategy] = await db.insert(savedStrategiesTable).values({
      userId: req.user.id,
      name,
      ticker,
      spotPrice: String(spotPrice),
      legs,
    }).returning();

    res.json({
      id: strategy.id,
      name: strategy.name,
      ticker: strategy.ticker,
      spotPrice: parseFloat(strategy.spotPrice),
      legs: strategy.legs,
      createdAt: strategy.createdAt?.toISOString(),
      updatedAt: strategy.updatedAt?.toISOString(),
    });
  } catch (e: any) {
    console.error("Save strategy error:", e);
    res.status(500).json({ error: "Failed to save strategy" });
  }
});

router.delete("/strategies/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const id = parseInt(req.params.id);

    const [existing] = await db
      .select()
      .from(savedStrategiesTable)
      .where(and(eq(savedStrategiesTable.id, id), eq(savedStrategiesTable.userId, req.user.id)));

    if (!existing) {
      res.status(404).json({ error: "Strategy not found" });
      return;
    }

    await db.delete(savedStrategiesTable).where(eq(savedStrategiesTable.id, id));
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete strategy error:", e);
    res.status(500).json({ error: "Failed to delete strategy" });
  }
});

export default router;
