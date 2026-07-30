import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * IP-based rate limit for authentication endpoints.
 * Login/registration are expensive (bcrypt cost 12), so keep this tight.
 */
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10, // 10 attempts per IP per 15 minutes
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

/**
 * Simple in-memory account lockout: after N consecutive failed logins for
 * an email, further attempts are rejected before hitting the database or
 * bcrypt, for LOCKOUT_MS.
 */
const MAX_CONSECUTIVE_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type FailureRecord = { count: number; lockedUntil: number | null; updatedAt: number };
const failures = new Map<string, FailureRecord>();

// Periodically drop stale entries so the map cannot grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of failures) {
    if (now - rec.updatedAt > LOCKOUT_MS * 2) failures.delete(key);
  }
}, 60 * 1000).unref();

function normalizeEmail(email: unknown): string | null {
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

export function accountLockout(req: Request, res: Response, next: NextFunction): void {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    next();
    return;
  }
  const rec = failures.get(email);
  if (rec?.lockedUntil && rec.lockedUntil > Date.now()) {
    const retryAfterSec = Math.ceil((rec.lockedUntil - Date.now()) / 1000);
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      error: "Too many failed login attempts. Account temporarily locked. Please try again later.",
    });
    return;
  }
  next();
}

export function recordLoginFailure(email: string): void {
  const now = Date.now();
  const rec = failures.get(email) ?? { count: 0, lockedUntil: null, updatedAt: now };
  rec.count += 1;
  rec.updatedAt = now;
  if (rec.count >= MAX_CONSECUTIVE_FAILURES) {
    rec.lockedUntil = now + LOCKOUT_MS;
    rec.count = 0;
  }
  failures.set(email, rec);
}

export function recordLoginSuccess(email: string): void {
  failures.delete(email);
}
