// The current day at UTC midnight. Spaced repetition works at day granularity,
// so the scheduler and the due/new queries all compare against a date with no
// time component. Resolving "today" once, here, keeps that boundary consistent
// across the study use cases. `now` is injectable so callers stay testable.
export function todayUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
