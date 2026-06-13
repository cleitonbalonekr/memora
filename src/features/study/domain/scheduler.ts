// Pure spaced-repetition scheduler: an Anki-style modified SM-2 at day
// granularity. `new Scheduler().schedule(state, grade, today)` advances a card's
// persisted SRS state and performs no I/O and reads no clock other than the
// injected `today`, so it is fully deterministic and unit-testable (ADR-007,
// ADR-002 phase-2 domain logic). The scheduler is a class so its parameters are
// a single injectable unit (`DEFAULT_SRS_PARAMS`), the natural seam for future
// per-deck configuration. Ease is carried as an integer permille (2500 = 2.50)
// to avoid float drift across long grade sequences.

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface SrsState {
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  dueDate: Date | null;
  firstReviewedAt: Date | null;
  suspendedAt: Date | null;
}

// SRS parameters bundled into one configurable unit. Eases are permille
// integers; multipliers are decimals applied to the day interval.
export interface SrsParams {
  startingEase: number;
  minEase: number;
  easyBonus: number;
  hardMultiplier: number;
  graduatingInterval: number;
  easyInterval: number;
  postLapseInterval: number;
  leechThreshold: number;
  maxInterval: number;
  newCardsPerDay: number;
  // Ease adjustment (permille) applied when the grade lands on a review card.
  easeDelta: Record<ReviewGrade, number>;
}

// Anki defaults, except the 365-day max interval.
export const DEFAULT_SRS_PARAMS: SrsParams = {
  startingEase: 2500,
  minEase: 1300,
  easyBonus: 1.3,
  hardMultiplier: 1.2,
  graduatingInterval: 1,
  easyInterval: 4,
  postLapseInterval: 1,
  leechThreshold: 8,
  maxInterval: 365,
  newCardsPerDay: 20,
  easeDelta: {
    again: -200,
    hard: -150,
    good: 0,
    easy: 150,
  },
};

// A scheduling grade (everything but `again`) is fully described by its ease
// delta plus how it grows a review card's interval from the current interval
// `I` and ease `E` (decimal). `again` is excluded — it lapses, it never grows.
type SchedulingGrade = Exclude<ReviewGrade, "again">;

interface GradeRule {
  graduatingInterval: number;
  growth: (intervalDays: number, ease: number) => number;
}

export class Scheduler {
  private readonly rules: Record<SchedulingGrade, GradeRule>;

  constructor(private readonly params: SrsParams = DEFAULT_SRS_PARAMS) {
    this.rules = {
      hard: {
        graduatingInterval: params.graduatingInterval,
        growth: (i) => i * params.hardMultiplier,
      },
      good: {
        graduatingInterval: params.graduatingInterval,
        growth: (i, e) => i * e,
      },
      easy: {
        graduatingInterval: params.easyInterval,
        growth: (i, e) => i * e * params.easyBonus,
      },
    };
  }

  // The daily new-card allowance, read by the queue builder so the policy has a
  // single source of truth.
  get newCardsPerDay(): number {
    return this.params.newCardsPerDay;
  }

  schedule(state: SrsState, grade: ReviewGrade, today: Date): SrsState {
    const firstReviewedAt = state.firstReviewedAt ?? today;
    const isNew = state.dueDate === null;

    if (grade === "again") {
      return this.applyAgain(state, today, firstReviewedAt, isNew);
    }

    return this.applyScheduling(
      state,
      this.rules[grade],
      this.params.easeDelta[grade],
      today,
      firstReviewedAt,
      isNew,
    );
  }

  // `again` never schedules forward. On a new (never-graduated) card it leaves
  // the SRS state untouched (the session round-robin re-shows it); on a review
  // card it lapses: interval resets, lapse count climbs, streak resets, ease
  // drops, and the card is due again today. Reaching the leech threshold
  // suspends the card.
  private applyAgain(
    state: SrsState,
    today: Date,
    firstReviewedAt: Date,
    isNew: boolean,
  ): SrsState {
    if (isNew) {
      return { ...state, firstReviewedAt };
    }

    const lapses = state.lapses + 1;
    return {
      ...state,
      intervalDays: this.params.postLapseInterval,
      ease: this.clampEase(state.ease + this.params.easeDelta.again),
      reps: 0,
      lapses,
      dueDate: today,
      firstReviewedAt,
      suspendedAt:
        lapses >= this.params.leechThreshold ? today : state.suspendedAt,
    };
  }

  // A passing grade graduates a new card to a fixed interval (ease unchanged —
  // only review cards move ease), or grows a review card's interval by the
  // grade's rule with a one-day floor so it always advances, capped at the
  // maximum.
  private applyScheduling(
    state: SrsState,
    rule: GradeRule,
    easeDelta: number,
    today: Date,
    firstReviewedAt: Date,
    isNew: boolean,
  ): SrsState {
    const intervalDays = isNew
      ? rule.graduatingInterval
      : this.capInterval(
          Math.max(
            state.intervalDays + 1,
            this.roundHalfUp(rule.growth(state.intervalDays, state.ease / 1000)),
          ),
        );

    const ease = isNew ? state.ease : this.clampEase(state.ease + easeDelta);

    return {
      ...state,
      intervalDays,
      ease,
      reps: state.reps + 1,
      dueDate: this.addDays(today, intervalDays),
      firstReviewedAt,
    };
  }

  private clampEase(ease: number): number {
    return Math.max(ease, this.params.minEase);
  }

  private capInterval(intervalDays: number): number {
    return Math.min(intervalDays, this.params.maxInterval);
  }

  // Round-half-up (e.g. 2.5 -> 3), the documented rounding rule for intervals.
  private roundHalfUp(value: number): number {
    return Math.floor(value + 0.5);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
