import { describe, expect, it } from "vitest";
import { normalizeExportPayload } from "./import-validation";
import type { ExportPayload } from "./types";

const now = "2026-05-22T12:00:00.000Z";

function validPayload(): ExportPayload {
  return {
    version: 1,
    exportedAt: now,
    subjects: [
      {
        id: "subject_math",
        name: "Mathematics",
        color: "#2563eb",
        icon: "",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tags: [
      {
        id: "tag_focus",
        name: "Deep focus",
        color: "#2563eb",
        description: "Quiet mode",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    studyDays: [
      {
        id: "day_2026_05_22",
        date: "2026-05-22",
        plannedBlockCount: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
    studyBlocks: [
      {
        id: "block_1",
        dayId: "day_2026_05_22",
        date: "2026-05-22",
        index: 0,
        subjectId: "subject_math",
        tagIds: ["tag_focus", "tag_focus"],
        status: "completed",
        plannedMinutes: 30,
        elapsedSeconds: 1800,
        startedAt: null,
        completedAt: now,
        note: "Covered derivatives.",
        createdAt: now,
        updatedAt: now,
      },
    ],
    settings: {
      id: "app",
      blockMinutes: 30,
      theme: "system",
      locale: "en",
      onboardingCompletedAt: now,
      onboardingVersion: 1,
      startOfWeek: "monday",
      screensaverEnabled: true,
      screensaverDelaySeconds: 180,
      notificationsEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
  };
}

describe("normalizeExportPayload", () => {
  it("normalizes a valid export payload", () => {
    const normalized = normalizeExportPayload(validPayload());

    expect(normalized.tags[0].color).toBe("var(--color-primary)");
    expect(normalized.subjects[0].color).toBe("var(--color-primary)");
    expect(normalized.studyBlocks[0].tagIds).toEqual(["tag_focus"]);
    expect(normalized.settings?.locale).toBe("en");
  });

  it("rejects malformed payloads before import", () => {
    expect(() => normalizeExportPayload({ version: 1, subjects: [], tags: [], studyDays: [], studyBlocks: "nope" })).toThrow(
      /Invalid import payload/,
    );
    expect(() => normalizeExportPayload({ ...validPayload(), subjects: [validPayload().subjects[0], validPayload().subjects[0]] })).toThrow(
      /Invalid import payload/,
    );
    expect(() => normalizeExportPayload({ ...validPayload(), studyBlocks: [{ ...validPayload().studyBlocks[0], status: "done" }] })).toThrow(
      /Invalid import payload/,
    );
  });
});
