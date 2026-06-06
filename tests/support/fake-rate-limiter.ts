import { RateLimiter, RateLimitResult } from "@/ports/rate-limiter";

// RateLimiter test double with a fixed verdict, so use-case tests can exercise
// the within-limit and over-limit paths deterministically.
export class FakeRateLimiter implements RateLimiter {
  readonly calls: string[] = [];

  constructor(private readonly result: RateLimitResult = { allowed: true }) {}

  check(userId: string): RateLimitResult {
    this.calls.push(userId);
    return this.result;
  }
}
