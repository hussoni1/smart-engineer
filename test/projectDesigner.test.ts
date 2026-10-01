import { describe, expect, it } from "vitest";
import { buildProjectPlan, type ProjectInputs } from "../src/projectDesigner";

const baseInputs: ProjectInputs = {
  domain: "agriculture",
  problem: "تقليل هدر الماء في أصص البيت",
  level: "beginner",
  budget: "low",
  timeline: "two-weeks",
  availableMaterials: "Arduino, حساس رطوبة، أسلاك",
};

describe("engineering project designer", () => {
  it("builds a domain-specific plan and recognizes materials the student already has", () => {
    const plan = buildProjectPlan(baseInputs);
    expect(plan.title).toContain("ريّ ذكي");
    expect(plan.problem).toBe(baseInputs.problem);
    expect(plan.materials.some((item) => item.available && item.name.includes("Arduino"))).toBe(true);
    expect(plan.phases).toHaveLength(4);
    expect(plan.safetyNotes.length).toBeGreaterThan(0);
  });

  it("adapts the schedule, level guidance, and budget advice to the selected constraints", () => {
    const plan = buildProjectPlan({ ...baseInputs, domain: "energy", level: "advanced", budget: "flexible", timeline: "month" });
    expect(plan.title).toContain("شمسي");
    expect(plan.phases[0].title).toContain("الأسبوع الأول");
    expect(plan.levelLabel).toContain("متقدم");
    expect(plan.budgetGuidance).toContain("تسجيل بيانات");
    expect(plan.phases[2].description).toContain("خط أساس");
    expect(plan.safetyNotes.join(" ")).toContain("شبكة المنزل");
  });

  it("creates a safe beginner AI/data plan when the student leaves optional text blank", () => {
    const plan = buildProjectPlan({ ...baseInputs, domain: "ai-data", problem: "", availableMaterials: "" });
    expect(plan.problem).toContain("لم يُحدد وصف إضافي");
    expect(plan.materials.every((item) => !item.available)).toBe(true);
    expect(plan.phases[1].description).toContain("مشرف");
    expect(plan.safetyNotes.join(" ")).toContain("معلومات شخصية");
  });
});
