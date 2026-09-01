import { describe, expect, it } from "vitest";
import { getNextProgress, isValidQuizInput } from "../worker/index";

describe("student progress rules", () => {
  it("accepts valid quiz submissions", () => {
    expect(isValidQuizInput("bim", 2, 2, 2)).toBe(true);
    expect(isValidQuizInput("unknown", 1, 2, 2)).toBe(false);
    expect(isValidQuizInput("bim", 4, 2, 2)).toBe(false);
    expect(isValidQuizInput("bim", 1, 3, 2)).toBe(false);
  });

  it("advances progress only after a passed quiz", () => {
    expect(getNextProgress(0, 1, true)).toEqual({ completedLessons: 1, progress: 33 });
    expect(getNextProgress(1, 2, false)).toEqual({ completedLessons: 1, progress: 33 });
    expect(getNextProgress(1, 2, true)).toEqual({ completedLessons: 2, progress: 67 });
  });
});
