import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const app: Express = express();

// Behind Replit's proxy: trust the first proxy hop so req.ip reflects the
// real client IP (required for accurate IP-based rate limiting).
app.set("trust proxy", 1);

// CORS: explicit origin allowlist derived from the Replit environment.
// Never reflect arbitrary origins while credentials are allowed — that lets
// any website make authenticated requests on behalf of a logged-in user.
const allowedOrigins = new Set<string>();
for (const domain of [
  ...(process.env.REPLIT_DOMAINS?.split(",") ?? []),
  process.env.REPLIT_DEV_DOMAIN,
  process.env.REPLIT_EXPO_DEV_DOMAIN,
]) {
  const trimmed = domain?.trim();
  if (trimmed) allowedOrigins.add(`https://${trimmed}`);
}
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost");
  allowedOrigins.add("http://127.0.0.1");
}

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Non-browser clients (native mobile apps, curl) send no Origin header.
      if (!origin) return callback(null, true);
      let allowed = allowedOrigins.has(origin);
      if (!allowed && process.env.NODE_ENV !== "production") {
        try {
          const { protocol, hostname } = new URL(origin);
          allowed =
            protocol === "http:" &&
            (hostname === "localhost" || hostname === "127.0.0.1");
        } catch {
          allowed = false;
        }
      }
      // Disallowed origins get no CORS headers (browser blocks the response).
      callback(null, allowed);
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
