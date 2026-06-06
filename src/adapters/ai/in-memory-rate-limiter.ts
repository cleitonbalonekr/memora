import { RateLimiter, RateLimitResult } from "@/ports/rate-limiter";
import { getRateLimitConfig, RateLimitConfig } from "./config";

// Fixed-window per-user rate limiter (design D7). Single-instance and in-memory:
// counters do not span processes or survive a restart. Acceptable for the MVP
// single-instance deploy and isolated behind RateLimiter so a durable adapter
// (Postgres/Redis) swaps in without touching use cases.

interface Window {
  count: number;
  // Epoch ms when the current window ends.
  resetAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, Window>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(config: RateLimitConfig = getRateLimitConfig()) {
    this.limit = config.limit;
    this.windowMs = config.windowSeconds * 1000;
  }

  check(userId: string): RateLimitResult {
    const now = Date.now();
    const existing = this.windows.get(userId);

    if (!existing || now >= existing.resetAt) {
      this.windows.set(userId, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }

    if (existing.count < this.limit) {
      existing.count += 1;
      return { allowed: true };
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
}
