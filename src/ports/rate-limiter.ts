// Port for per-user rate limiting (design D7). The MVP adapter is in-memory and
// single-instance; the interface keeps a durable implementation (Postgres/Redis)
// a one-adapter swap away without touching use cases.

export interface RateLimitResult {
  allowed: boolean;
  // Seconds until the user may try again. Present only when not allowed.
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  check(userId: string): RateLimitResult;
}
