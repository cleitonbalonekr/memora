import { describe, expect, it } from "vitest";
import { DEFAULT_SRS_PARAMS, ReviewGrade, Scheduler, SrsState } from "./scheduler";

const EASY_INTERVAL = DEFAULT_SRS_PARAMS.easyInterval;
const GRADUATING_INTERVAL = DEFAULT_SRS_PARAMS.graduatingInterval;
const MAX_INTERVAL = DEFAULT_SRS_PARAMS.maxInterval;
const MIN_EASE = DEFAULT_SRS_PARAMS.minEase;
const STARTING_EASE = DEFAULT_SRS_PARAMS.startingEase;

const scheduler = new Scheduler();
const schedule = (state: SrsState, grade: ReviewGrade, today: Date) =>
  scheduler.schedule(state, grade, today);

const DAY0 = new Date("2026-01-01T00:00:00.000Z");

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function newCard(overrides: Partial<SrsState> = {}): SrsState {
  return {
    intervalDays: 0,
    ease: STARTING_EASE,
    reps: 0,
    lapses: 0,
    dueDate: null,
    firstReviewedAt: null,
    suspendedAt: null,
    ...overrides,
  };
}

function reviewCard(overrides: Partial<SrsState> = {}): SrsState {
  return newCard({
    intervalDays: 10,
    dueDate: DAY0,
    firstReviewedAt: DAY0,
    reps: 1,
    ...overrides,
  });
}

describe("schedule — new-card graduation", () => {
  it("graduates good to 1 day at the starting ease and records the first review", () => {
    const next = schedule(newCard(), "good", DAY0);

    expect(next.intervalDays).toBe(GRADUATING_INTERVAL);
    expect(next.dueDate).toEqual(addDays(DAY0, 1));
    expect(next.ease).toBe(STARTING_EASE);
    expect(next.reps).toBe(1);
    expect(next.firstReviewedAt).toEqual(DAY0);
  });

  it("graduates hard to 1 day", () => {
    const next = schedule(newCard(), "hard", DAY0);

    expect(next.intervalDays).toBe(GRADUATING_INTERVAL);
    expect(next.ease).toBe(STARTING_EASE);
  });

  it("graduates easy to 4 days", () => {
    const next = schedule(newCard(), "easy", DAY0);

    expect(next.intervalDays).toBe(EASY_INTERVAL);
    expect(next.dueDate).toEqual(addDays(DAY0, 4));
  });

  it("leaves a new card untouched on again but records the first review", () => {
    const next = schedule(newCard(), "again", DAY0);

    expect(next.intervalDays).toBe(0);
    expect(next.dueDate).toBeNull();
    expect(next.ease).toBe(STARTING_EASE);
    expect(next.lapses).toBe(0);
    expect(next.reps).toBe(0);
    expect(next.firstReviewedAt).toEqual(DAY0);
  });
});

describe("schedule — review-card growth", () => {
  it("good multiplies the interval by ease", () => {
    const next = schedule(reviewCard({ intervalDays: 10, ease: 2500 }), "good", DAY0);

    expect(next.intervalDays).toBe(25); // max(11, round(10 * 2.5))
    expect(next.ease).toBe(2500);
    expect(next.dueDate).toEqual(addDays(DAY0, 25));
    expect(next.reps).toBe(2);
  });

  it("hard grows slowly and lowers ease", () => {
    const next = schedule(reviewCard({ intervalDays: 10, ease: 2500 }), "hard", DAY0);

    expect(next.intervalDays).toBe(12); // max(11, round(10 * 1.2))
    expect(next.ease).toBe(2350);
  });

  it("easy applies the bonus and raises ease", () => {
    const next = schedule(reviewCard({ intervalDays: 10, ease: 2500 }), "easy", DAY0);

    expect(next.intervalDays).toBe(33); // max(11, round(10 * 2.5 * 1.3 = 32.5))
    expect(next.ease).toBe(2650);
  });

  it("always grows by at least one day (the max(I+1, ...) floor)", () => {
    // hard on a 1-day card: round(1 * 1.2) = 1, but the floor forces 2.
    const next = schedule(reviewCard({ intervalDays: 1, ease: 2500 }), "hard", DAY0);

    expect(next.intervalDays).toBe(2);
  });
});

describe("schedule — clamps and caps", () => {
  it("never drops ease below the minimum", () => {
    const next = schedule(reviewCard({ ease: 1400 }), "hard", DAY0);

    expect(next.ease).toBe(MIN_EASE); // 1400 - 150 = 1250 -> clamped to 1300
  });

  it("clamps ease on a lapse too", () => {
    const next = schedule(reviewCard({ ease: 1450 }), "again", DAY0);

    expect(next.ease).toBe(MIN_EASE); // 1450 - 200 = 1250 -> 1300
  });

  it("caps the interval at the maximum", () => {
    const next = schedule(reviewCard({ intervalDays: 300, ease: 2500 }), "good", DAY0);

    expect(next.intervalDays).toBe(MAX_INTERVAL); // round(300 * 2.5) = 750 -> 365
  });

  it("rounds half up", () => {
    // 3 * 2.5 = 7.5 -> 8
    const next = schedule(reviewCard({ intervalDays: 3, ease: 2500 }), "good", DAY0);
    expect(next.intervalDays).toBe(8);

    // 9 * 2.35 * 1.3 = 27.495 -> 27 (below the half boundary)
    const justUnder = schedule(reviewCard({ intervalDays: 9, ease: 2350 }), "easy", DAY0);
    expect(justUnder.intervalDays).toBe(27);
  });
});

describe("schedule — lapses and leeches", () => {
  it("resets a forgotten review card", () => {
    const next = schedule(
      reviewCard({ intervalDays: 25, ease: 2500, reps: 3, lapses: 2 }),
      "again",
      DAY0,
    );

    expect(next.intervalDays).toBe(1);
    expect(next.lapses).toBe(3);
    expect(next.reps).toBe(0);
    expect(next.ease).toBe(2300);
    expect(next.dueDate).toEqual(DAY0);
    expect(next.suspendedAt).toBeNull();
  });

  it("suspends a card that reaches the leech threshold", () => {
    const next = schedule(reviewCard({ lapses: 7 }), "again", DAY0);

    expect(next.lapses).toBe(8);
    expect(next.suspendedAt).toEqual(DAY0);
  });
});

describe("schedule — the worked example", () => {
  it("follows the design's good, good, hard, good, easy, again, good sequence", () => {
    let state = newCard();

    state = schedule(state, "good", DAY0);
    expect(state).toMatchObject({ intervalDays: 1, ease: 2500, lapses: 0 });
    expect(state.dueDate).toEqual(addDays(DAY0, 1));

    state = schedule(state, "good", addDays(DAY0, 1));
    expect(state).toMatchObject({ intervalDays: 3, ease: 2500 });
    expect(state.dueDate).toEqual(addDays(DAY0, 4));

    state = schedule(state, "hard", addDays(DAY0, 4));
    expect(state).toMatchObject({ intervalDays: 4, ease: 2350 });
    expect(state.dueDate).toEqual(addDays(DAY0, 8));

    state = schedule(state, "good", addDays(DAY0, 8));
    expect(state).toMatchObject({ intervalDays: 9, ease: 2350 });
    expect(state.dueDate).toEqual(addDays(DAY0, 17));

    state = schedule(state, "easy", addDays(DAY0, 17));
    expect(state).toMatchObject({ intervalDays: 27, ease: 2500 });
    expect(state.dueDate).toEqual(addDays(DAY0, 44));

    state = schedule(state, "again", addDays(DAY0, 44));
    expect(state).toMatchObject({ intervalDays: 1, ease: 2300, lapses: 1, reps: 0 });
    expect(state.dueDate).toEqual(addDays(DAY0, 44));

    state = schedule(state, "good", addDays(DAY0, 44));
    expect(state).toMatchObject({ intervalDays: 2, ease: 2300, lapses: 1 });
    expect(state.dueDate).toEqual(addDays(DAY0, 46));
  });
});
