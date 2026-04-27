import type { Express } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export function setupSecurity(app: Express) {
  app.disable("x-powered-by");

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use("/api/auth/login", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.use("/api/ai", rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 20),
    standardHeaders: true,
    legacyHeaders: false,
  }));
}
