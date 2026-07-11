import { describe, expect, it } from "vitest";
import { hasSameDailyFractalContent, isDailyFractalCurrent } from "./fractal-persistence";
import type { DailyFractal } from "./types";

const current = {
  id: "fractal_1",
  date: "2026-07-10",
  status: "active",
  visibleSteps: 3,
  stats: { endDate: "2026-07-11" },
  seed: "seed",
  params: {},
  config: {},
  createdAt: "2026-07-10T10:00:00.000Z",
  updatedAt: "2026-07-11T10:00:00.000Z",
} as DailyFractal;

describe("fractal persistence", () => {
  it("ignores persistence timestamps but detects material changes", () => {
    expect(hasSameDailyFractalContent(current, { ...current, updatedAt: "2026-07-11T11:00:00.000Z" })).toBe(true);
    expect(hasSameDailyFractalContent(current, { ...current, visibleSteps: 4, updatedAt: "2026-07-11T11:00:00.000Z" })).toBe(false);
  });

  it("recognizes an artwork already reconciled for the date and source revisions", () => {
    expect(isDailyFractalCurrent(current, "2026-07-11", [{ updatedAt: current.updatedAt }])).toBe(true);
    expect(isDailyFractalCurrent(current, "2026-07-12", [{ updatedAt: current.updatedAt }])).toBe(false);
    expect(isDailyFractalCurrent(current, "2026-07-11", [{ updatedAt: "2026-07-11T10:00:00.001Z" }])).toBe(false);
  });
});
