import { describe, expect, it } from "vitest";
import { validateAction, validateStatsFilters } from "./api-validation";

describe("API validation", () => {
  it("normalizes a valid note mutation", () => {
    expect(validateAction({ action: "updateBlockNote", payload: { id: "block_1", note: "Study note" } })).toEqual({
      action: "updateBlockNote",
      payload: { id: "block_1", note: "Study note" },
    });
  });

  it("rejects oversized persisted strings and unexpected settings keys", () => {
    expect(() => validateAction({ action: "updateBlockNote", payload: { id: "block_1", note: "x".repeat(10001) } })).toThrow("note");
    expect(() => validateAction({ action: "updateSettings", payload: { patch: { id: "attacker" } } })).toThrow("patch");
  });

  it("rejects malformed plans and analytics filters", () => {
    expect(() => validateAction({ action: "createOrUpdateDayPlan", payload: { date: "2026-99-99", plannedBlockCount: 1, assignments: [] } })).toThrow();
    expect(() => validateStatsFilters({ range: "forever" })).toThrow("range");
  });
});
