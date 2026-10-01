import { describe, expect, it } from "vitest";
import { getNextProgress, isValidProjectPlanPayload, isValidQuizInput } from "../worker/index";

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

describe("student project plan validation", () => {
  it("accepts JSON objects within the storage limit and legacy requests without a plan", () => {
    expect(isValidProjectPlanPayload({ title: "Solar test", phases: [{ title: "Measure" }] })).toBe(true);
    expect(isValidProjectPlanPayload(undefined)).toBe(true);
    expect(isValidProjectPlanPayload(null)).toBe(true);
  });

  it("rejects non-object plans and plans larger than 64 KB", () => {
    expect(isValidProjectPlanPayload("not a plan")).toBe(false);
    expect(isValidProjectPlanPayload(["not", "an object"])).toBe(false);
    expect(isValidProjectPlanPayload({ details: "x".repeat(65 * 1024) })).toBe(false);
  });
});
