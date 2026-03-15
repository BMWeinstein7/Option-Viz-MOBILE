import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) {
      res.status(400).json({ error: "Username (3+ chars) and password (6+ chars) required" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase()));
    if (existing.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      username: username.toLowerCase(),
      passwordHash,
      displayName: displayName || username,
    }).returning();

    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    });
  } catch (e: any) {
    console.error("Register error:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase()));
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    });
  } catch (e: any) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", (req, res) => {
  const userId = (req.session as any)?.userId;
  const username = (req.session as any)?.username;
  if (!userId) {
    res.json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, id: userId, username });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
