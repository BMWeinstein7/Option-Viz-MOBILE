import { Router } from "express";
import { db } from "@workspace/db";
import { savedStrategiesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

router.get("/strategies", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const strategies = await db
      .select()
      .from(savedStrategiesTable)
      .where(eq(savedStrategiesTable.userId, userId))
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

router.post("/strategies", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { name, ticker, spotPrice, legs } = req.body;

    if (!name || !ticker || !spotPrice || !legs) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [strategy] = await db.insert(savedStrategiesTable).values({
      userId,
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

router.delete("/strategies/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const id = parseInt(req.params.id);

    const [existing] = await db
      .select()
      .from(savedStrategiesTable)
      .where(eq(savedStrategiesTable.id, id));

    if (!existing || existing.userId !== userId) {
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
